"use client";

import { useCallback, useState, useTransition } from "react";
import { useDropzone } from "react-dropzone";
import { uploadReferencePhotoAction } from "../api/actions";

export function PhotoDropzone({ measurementId }: { measurementId: string }) {
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;
      setError(null);
      setPreview(URL.createObjectURL(file));

      const formData = new FormData();
      formData.set("file", file);
      startTransition(async () => {
        const result = await uploadReferencePhotoAction(
          measurementId,
          formData,
        );
        if (!result.success) {
          setError(result.error ?? "Upload failed.");
        }
      });
    },
    [measurementId],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });

  return (
    <div className="flex flex-col gap-2">
      <div
        {...getRootProps()}
        className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-border text-sm text-muted-foreground hover:bg-accent/50"
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the photo here…</p>
        ) : (
          <p>Drag a reference photo here, or click to select</p>
        )}
      </div>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element -- ephemeral client-side object URL preview
        <img
          src={preview}
          alt="Reference preview"
          className="h-24 w-24 rounded-md object-cover"
        />
      ) : null}
      {pending ? (
        <p className="text-xs text-muted-foreground">Uploading…</p>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
