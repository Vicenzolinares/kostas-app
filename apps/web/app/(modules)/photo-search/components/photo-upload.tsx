"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { ImagePlus, UploadCloud } from "lucide-react";
import { Button, Card, CardContent } from "@kostas/ui";
import type { EnrichedPhotoMatch } from "../types";
import { MatchReview } from "./match-review";

interface UploadResponse {
  id: string;
  status: string;
  description?: string;
  demoMode?: boolean;
  matches?: EnrichedPhotoMatch[];
  error?: string;
}

/**
 * Upload -> optimize (Sharp, server-side) -> AI vision -> pgvector
 * similarity search pipeline entry point. react-dropzone handles the
 * file picker; the actual optimize/embed/search work happens in
 * /api/photo-search/upload.
 */
export function PhotoUpload() {
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setPending(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/photo-search/upload", {
        method: "POST",
        body: formData,
      });
      const data: UploadResponse = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
      } else {
        setResult(data);
        if (data.error) setError(data.error);
      }
    } catch {
      setError("Upload failed.");
    } finally {
      setPending(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="pt-6">
          <div
            {...getRootProps()}
            data-testid="photo-dropzone"
            className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed text-center transition-colors ${
              preview ? "p-6" : "p-10"
            } ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40 hover:bg-accent/30"
            }`}
          >
            <input {...getInputProps()} />
            {preview ? (
              <Image
                src={preview}
                alt="Upload preview"
                width={200}
                height={200}
                className="rounded-md border border-border object-cover"
                unoptimized
              />
            ) : (
              <>
                <span className="flex size-12 items-center justify-center rounded-full bg-accent text-primary">
                  <UploadCloud className="size-6" aria-hidden />
                </span>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">
                    Drag &amp; drop a photo here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or HEIC — one photo at a time.
                  </p>
                </div>
              </>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
            >
              <ImagePlus className="mr-2 size-4" aria-hidden />
              {pending
                ? "Analyzing…"
                : preview
                  ? "Replace photo"
                  : "Choose photo"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {result?.matches ? (
        <MatchReview
          searchId={result.id}
          description={result.description}
          demoMode={result.demoMode}
          status={result.status}
          matches={result.matches}
        />
      ) : null}
    </div>
  );
}
