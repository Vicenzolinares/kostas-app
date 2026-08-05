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
import { label, type Language } from "@/lib/i18n";

/**
 * Notes and photos from the floor. Bilingual like the rest of the portal,
 * and still routed through the offline queue rather than a Server Action —
 * a photo taken in the back of the shop is exactly where signal drops.
 */
export function TaskNotePanel({ lang }: { lang: Language }) {
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
        <CardTitle className="text-base">{label("noteLogged", lang)}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Textarea
          placeholder={label("workingOn", lang)}
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
            {label("photoUploaded", lang)}
          </Button>
        )}
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!note.trim() && !photo}
        >
          {label("noteLogged", lang)}
        </Button>
        {submitted ? (
          <p className="text-xs text-muted-foreground">
            {label("offlineQueued", lang)}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
