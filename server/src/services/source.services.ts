import type { Prisma } from "../generated/prisma/client.js";
import { uploadPdfToCloudinary } from "../lib/cloudinary.js";
import { scrapeWebsite } from "../lib/firecrawl.js";
import { extractPdfFromBuffer } from "../lib/pdf.js";
import { enqueueSourceProcessing } from "../lib/source-events.js";
import { fetchYoutubeTranscript } from "../lib/youtube.js";
import {
    createSourceRecord,
    deleteSourceRecord,
    findSourceByIdAndWorkspaceId,
    findSourcesByWorkspaceId,
    updateSourceRecord,
    type SourceRecord,
} from "../repository/source.repository.js";
import { NotFoundError } from "../types/app-error.js";
import { CreateSourceInput, ImportWebsiteInput, ImportYoutubeInput, ListSourcesQuery } from "../validators/source.validator.js";
import { getWorkspaceByIdForUser } from "./workspace.services.js";

async function assertWorkspaceAccess(workspaceId: string, userId: string) {
    await getWorkspaceByIdForUser(workspaceId, userId);
}

async function createAndProcessSource(
    data: Parameters<typeof createSourceRecord>[0],
) {
    const source = await createSourceRecord(data);

    // Kick off the async extract → chunk → embed → index pipeline. Without
    // this the source stays PENDING forever (the Inngest worker never runs).
    await enqueueSourceProcessing({
        sourceId: source.id,
        workspaceId: source.workspaceId,
    });

    return source;
}

export async function listSourcesForWorkspace(
    workspaceId: string,
    userId: string,
    filters: ListSourcesQuery = {},
) {
    await assertWorkspaceAccess(workspaceId, userId);
    return findSourcesByWorkspaceId(workspaceId, filters);
}

export async function getSourceForWorkspace(
    workspaceId: string,
    sourceId: string,
    userId: string,
): Promise<SourceRecord> {
    await assertWorkspaceAccess(workspaceId, userId);

    const source = await findSourceByIdAndWorkspaceId(sourceId, workspaceId);

    if (!source) {
        throw new NotFoundError("Source not found");
    }

    return source;
}

export async function deleteSourceForWorkspace(
    workspaceId: string,
    sourceId: string,
    userId: string,
) {
    await getSourceForWorkspace(workspaceId, sourceId, userId);
    await deleteSourceRecord(sourceId);
}

/**
 * Re-enqueues processing for a source that is stuck (PENDING) or FAILED.
 *
 * Resets the row to PENDING and clears the previous processing error, then
 * sends a fresh `source/created` event so the Inngest pipeline re-runs
 * extract → chunk → embed → index. Chunks/vectors are rebuilt idempotently
 * by the worker (chunk step deletes existing rows before re-creating).
 */
export async function reprocessSourceForWorkspace(
    workspaceId: string,
    sourceId: string,
    userId: string,
) {
    const source = await getSourceForWorkspace(workspaceId, sourceId, userId);

    const metadata =
        source.metadata &&
        typeof source.metadata === "object" &&
        !Array.isArray(source.metadata)
            ? { ...(source.metadata as Record<string, unknown>) }
            : {};
    delete metadata.processingError;

    const updated = await updateSourceRecord(sourceId, {
        status: "PENDING",
        metadata: metadata as Prisma.InputJsonValue,
    });

    await enqueueSourceProcessing({
        sourceId: updated.id,
        workspaceId: updated.workspaceId,
    });

    return updated;
}

export async function bulkDeleteSourcesForWorkspace(
    workspaceId: string,
    userId: string,
    sourceIds: string[],
) {
    await assertWorkspaceAccess(workspaceId, userId);

    for (const sourceId of sourceIds) {
        await deleteSourceForWorkspace(workspaceId, sourceId, userId);
    }
}

export async function createTextOrMarkdownSource(
    workspaceId: string,
    userId: string,
    input: CreateSourceInput,
) {
    await assertWorkspaceAccess(workspaceId, userId);

    return createAndProcessSource({
        workspaceId,
        type: input.type,
        title: input.title,
        content: input.content,
        status: "PENDING",
    });
}

export async function importWebsiteSource(
    workspaceId: string,
    userId: string,
    input: ImportWebsiteInput,
) {
    await getWorkspaceByIdForUser(workspaceId, userId);

    const scraped = await scrapeWebsite(input.url);

    return createAndProcessSource({
        workspaceId,
        type: "WEBSITE",
        title: input.title || scraped.title || input.url,
        content: scraped.markdown,
        url: scraped.sourceUrl,
        status: "PENDING",
        metadata: {
            importedFrom: scraped.sourceUrl,
        },
    });
}

export async function uploadPdfSource(
    workspaceId: string,
    userId: string,
    file: Express.Multer.File,
    title?: string,
) {
    await getWorkspaceByIdForUser(workspaceId, userId);

    const upload = await uploadPdfToCloudinary(
        file.buffer,
        file.originalname,
    );

    let content: string | null = null;
    let pageCount: number | undefined;

    try {
        const extracted = await extractPdfFromBuffer(file.buffer);
        content = extracted.text;
        pageCount = extracted.pageCount;
    } catch {
        // Inngest will retry extraction from Cloudinary if upload-time parse fails.
    }

    return createAndProcessSource({
        workspaceId,
        type: "PDF",
        title: title?.trim() || file.originalname.replace(/\.pdf$/i, ""),
        content,
        status: "PENDING",
        metadata: {
            fileUrl: upload.secureUrl,
            fileName: upload.originalFilename,
            fileSize: upload.bytes,
            publicId: upload.publicId,
            resourceType: upload.resourceType,
            pageCount,
        },
    });
}

export async function importYoutubeSource(
    workspaceId: string,
    userId: string,
    input: ImportYoutubeInput,
) {
    await getWorkspaceByIdForUser(workspaceId, userId);

    const transcript = await fetchYoutubeTranscript(input.url);

    return createAndProcessSource({
        workspaceId,
        type: "YOUTUBE",
        title: input.title || `YouTube: ${transcript.videoId}`,
        content: transcript.content,
        url: input.url,
        status: "PENDING",
        metadata: {
            videoId: transcript.videoId,
        },
    });
}


