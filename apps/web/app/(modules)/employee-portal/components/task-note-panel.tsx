"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Textarea,
} from "@kostas/ui";
import { useOfflineQueueStore } from "../store/offline-queue";
import { CameraCapture } from "./camera-capture";

export function TaskNotePanel() {
  const enqueue = useOfflineQueueStore((s) => s.enqueue);
  const [note, setNote] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    if (!note.trim() && !photo) return;
    enqueue({
      type: photo ? "photo_upload" : "task_note",
      payload: { note: note.trim() },
      photoDataUrl: photo ?? undefined,
      occurredAt: new Date(),
    });
    setNote("");
    setPhoto(null);
    setShowCamera(false);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task note / photo</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Textarea
          placeholder="What did you work on?"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {showCamera ? (
          <CameraCapture onCapture={setPhoto} />
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowCamera(true)}
          >
            {photo ? "Retake photo" : "Add photo"}
          </Button>
        )}
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!note.trim() && !photo}
        >
          Queue update
        </Button>
        {submitted ? (
          <p className="text-xs text-muted-foreground">
            Queued — will sync automatically.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
