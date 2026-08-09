"use client";

import { useRef, useState } from "react";
import {
  RiErrorWarningLine,
  RiFilePdfLine,
  RiUploadCloud2Line,
} from "@remixicon/react";

import {
  useCreateTextSource,
  useImportWebsiteSource,
  useImportYoutubeSource,
  useUploadPdfSource,
} from "@/hooks/use-sources";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type SourceTab = "upload" | "website" | "youtube" | "text";

// Matches the server's multer limit (10 MB, PDF only).
const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AddSourceDialogProps {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSourceDialog({
  workspaceId,
  open,
  onOpenChange,
}: AddSourceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add source</DialogTitle>
          <DialogDescription>
            Upload a PDF, import a link, or paste text — the workspace AI
            answers from your sources.
          </DialogDescription>
        </DialogHeader>

        {/* DialogContent only mounts while open, so the form remounts with
            fresh state every time the dialog opens. */}
        <AddSourceForm
          workspaceId={workspaceId}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function AddSourceForm({
  workspaceId,
  onClose,
}: {
  workspaceId: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<SourceTab>("upload");
  const [error, setError] = useState<string | null>(null);

  // Upload tab
  const [file, setFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Website / YouTube tabs
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [websiteTitle, setWebsiteTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeTitle, setYoutubeTitle] = useState("");

  // Text tab
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [textType, setTextType] = useState<"TEXT" | "MARKDOWN">("TEXT");

  const uploadPdf = useUploadPdfSource(workspaceId);
  const importWebsite = useImportWebsiteSource(workspaceId);
  const importYoutube = useImportYoutubeSource(workspaceId);
  const createText = useCreateTextSource(workspaceId);

  const isPending =
    uploadPdf.isPending ||
    importWebsite.isPending ||
    importYoutube.isPending ||
    createText.isPending;

  const pickFile = (candidate: File | undefined | null) => {
    setError(null);
    if (!candidate) return;
    if (candidate.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return;
    }
    if (candidate.size > MAX_PDF_SIZE_BYTES) {
      setError("PDF must be 10 MB or smaller.");
      return;
    }
    setFile(candidate);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      if (tab === "upload") {
        if (!file) {
          setError("Choose a PDF file to upload.");
          return;
        }
        await uploadPdf.mutateAsync({
          file,
          title: fileTitle.trim() || undefined,
        });
      } else if (tab === "website") {
        await importWebsite.mutateAsync({
          url: websiteUrl.trim(),
          title: websiteTitle.trim() || undefined,
        });
      } else if (tab === "youtube") {
        await importYoutube.mutateAsync({
          url: youtubeUrl.trim(),
          title: youtubeTitle.trim() || undefined,
        });
      } else {
        await createText.mutateAsync({
          type: textType,
          title: textTitle.trim(),
          content: textContent.trim(),
        });
      }
      onClose();
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Something went wrong",
      );
    }
  };

  const canSubmit =
    !isPending &&
    ((tab === "upload" && Boolean(file)) ||
      (tab === "website" && Boolean(websiteUrl.trim())) ||
      (tab === "youtube" && Boolean(youtubeUrl.trim())) ||
      (tab === "text" &&
        Boolean(textTitle.trim()) &&
        Boolean(textContent.trim())));

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <RiErrorWarningLine />
              <AlertTitle>Couldn&apos;t add source</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Tabs
            value={tab}
            onValueChange={(value) => {
              setTab(value as SourceTab);
              setError(null);
            }}
          >
            <TabsList className="w-full">
              <TabsTrigger value="upload">PDF upload</TabsTrigger>
              <TabsTrigger value="website">Website</TabsTrigger>
              <TabsTrigger value="youtube">YouTube</TabsTrigger>
              <TabsTrigger value="text">Text</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="flex flex-col gap-4 pt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(event) => {
                  pickFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  pickFile(event.dataTransfer.files?.[0]);
                }}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center transition-colors hover:bg-muted/50",
                  isDragging && "border-primary bg-primary/5",
                )}
              >
                {file ? (
                  <>
                    <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <RiFilePdfLine className="size-5" />
                    </span>
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)} — click to choose a
                      different file
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex size-10 items-center justify-center rounded-full bg-muted">
                      <RiUploadCloud2Line className="size-5 text-muted-foreground" />
                    </span>
                    <span className="text-sm font-medium">
                      Drop a PDF here, or click to browse
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PDF up to 10 MB
                    </span>
                  </>
                )}
              </button>

              <div className="flex flex-col gap-2">
                <Label htmlFor="source-file-title">
                  Title{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional — defaults to the file name)
                  </span>
                </Label>
                <Input
                  id="source-file-title"
                  value={fileTitle}
                  onChange={(event) => setFileTitle(event.target.value)}
                  placeholder="e.g. Q3 report"
                  maxLength={200}
                />
              </div>
            </TabsContent>

            <TabsContent value="website" className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="source-website-url">Website URL</Label>
                <Input
                  id="source-website-url"
                  type="url"
                  value={websiteUrl}
                  onChange={(event) => setWebsiteUrl(event.target.value)}
                  placeholder="https://example.com/article"
                />
                <p className="text-xs text-muted-foreground">
                  The page is scraped and stored as markdown.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="source-website-title">
                  Title{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="source-website-title"
                  value={websiteTitle}
                  onChange={(event) => setWebsiteTitle(event.target.value)}
                  placeholder="Defaults to the page title"
                  maxLength={200}
                />
              </div>
            </TabsContent>

            <TabsContent value="youtube" className="flex flex-col gap-4 pt-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="source-youtube-url">YouTube URL</Label>
                <Input
                  id="source-youtube-url"
                  type="url"
                  value={youtubeUrl}
                  onChange={(event) => setYoutubeUrl(event.target.value)}
                  placeholder="https://www.youtube.com/watch?v=…"
                />
                <p className="text-xs text-muted-foreground">
                  The video transcript is imported as the source content.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="source-youtube-title">
                  Title{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="source-youtube-title"
                  value={youtubeTitle}
                  onChange={(event) => setYoutubeTitle(event.target.value)}
                  placeholder="Defaults to the video id"
                  maxLength={200}
                />
              </div>
            </TabsContent>

            <TabsContent value="text" className="flex flex-col gap-4 pt-2">
              <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="source-text-title">Title</Label>
                  <Input
                    id="source-text-title"
                    value={textTitle}
                    onChange={(event) => setTextTitle(event.target.value)}
                    placeholder="e.g. Meeting notes"
                    maxLength={200}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="source-text-type">Format</Label>
                  <Select
                    value={textType}
                    onValueChange={(value) =>
                      setTextType(value as "TEXT" | "MARKDOWN")
                    }
                  >
                    <SelectTrigger id="source-text-type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEXT">Plain text</SelectItem>
                      <SelectItem value="MARKDOWN">Markdown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="source-text-content">Content</Label>
                <Textarea
                  id="source-text-content"
                  value={textContent}
                  onChange={(event) => setTextContent(event.target.value)}
                  placeholder="Paste or write the source content…"
                  rows={6}
                  className="max-h-48 overflow-y-auto"
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isPending ? <Spinner /> : null}
              Add source
            </Button>
          </DialogFooter>
    </form>
  );
}
