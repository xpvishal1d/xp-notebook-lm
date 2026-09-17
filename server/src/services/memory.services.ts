import {
    addUserMemory,
    deleteUserMemory,
    listUserMemories,
    updateUserMemory,
    type AppMemory,
} from "../lib/mem0.js";
import { NotFoundError } from "../types/app-error.js";
import type {
    CreateMemoryInput,
    UpdateMemoryInput,
} from "../validators/memory.validator.js";

/**
 * Lists all memories stored for a user in Mem0.
 *
 * @param userId - Authenticated user's id
 * @returns Array of normalized memories (empty when Mem0 is not configured)
 */
export function listMemoriesForUser(userId: string) {
    return listUserMemories(userId);
}

/**
 * Creates a manual memory owned by the user.
 *
 * @param userId - Authenticated user's id
 * @param input - Memory text, optional infer flag and metadata
 * @returns Created memory record with `source: "manual"`
 */
export function createMemoryForUser(
    userId: string,
    input: CreateMemoryInput,
) {
    return addUserMemory(userId, {
        memory: input.memory,
        infer: input.infer,
        metadata: { ...input.metadata, source: "manual" },
    });
}

/**
 * Verifies a memory exists and belongs to the user.
 *
 * @param memoryId - Mem0 memory id
 * @param userId - Authenticated user's id
 * @returns The matching memory
 * @throws {NotFoundError} When the memory does not exist for this user
 */
async function getMemoryByIdForUser(
    memoryId: string,
    userId: string,
): Promise<AppMemory> {
    const memories = await listUserMemories(userId);
    const memory = memories.find((entry) => entry.id === memoryId);

    if (!memory) {
        throw new NotFoundError("Memory not found");
    }

    return memory;
}

/**
 * Updates the text of a user's memory after ownership verification.
 *
 * @param memoryId - Mem0 memory id
 * @param userId - Authenticated user's id
 * @param input - New memory text
 * @returns Updated memory record
 */
export async function updateMemoryForUser(
    memoryId: string,
    userId: string,
    input: UpdateMemoryInput,
) {
    await getMemoryByIdForUser(memoryId, userId);
    return updateUserMemory(memoryId, { memory: input.memory });
}

/**
 * Deletes a user's memory after ownership verification.
 *
 * @param memoryId - Mem0 memory id
 * @param userId - Authenticated user's id
 * @returns Resolves when deletion completes
 */
export async function deleteMemoryForUser(
    memoryId: string,
    userId: string,
) {
    await getMemoryByIdForUser(memoryId, userId);
    await deleteUserMemory(memoryId);
}
