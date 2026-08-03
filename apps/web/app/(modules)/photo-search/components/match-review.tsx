"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@kostas/ui";
import { confirmPhotoMatchAction } from "../api/actions";
import type { PhotoMatchCandidate } from "../types";

interface MatchReviewProps {
  searchId: string;
  description?: string;
  matches: PhotoMatchCandidate[];
}

function confidenceVariant(similarity: number): "default" | "secondary" | "outline" {
  if (similarity >= 0.85) return "default";
  if (similarity >= 0.7) return "secondary";
  return "outline";
}

export function MatchReview({ searchId, description, matches }: MatchReviewProps) {
  const [pending, startTransition] = useTransition();
  const [decision, setDecision] = useState<"confirmed" | "rejected" | null>(null);

  function confirm(referenceId: string | null) {
    startTransition(async () => {
      const result = await confirmPhotoMatchAction({ searchId, referenceId });
      if (result.success) {
        setDecision(referenceId ? "confirmed" : "rejected");
      }
    });
  }

  if (decision) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          {decision === "confirmed" ? "Match confirmed and saved." : "No match recorded — search dismissed."}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suggested matches</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {description ? <p className="text-sm text-muted-foreground">AI description: {description}</p> : null}
        {matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No similar photos found in the catalog yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {matches.map((match) => (
              <div key={match.referenceId} className="flex flex-col gap-2 rounded-md border border-border p-3">
                <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                  <Image
                    src={match.storageKey.startsWith("/") ? match.storageKey : `/api/storage/${match.storageKey}`}
                    alt={match.label ?? "Reference photo"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <p className="text-sm font-medium">{match.label ?? "Untitled"}</p>
                <Badge variant={confidenceVariant(match.similarity)} className="w-fit">
                  {(match.similarity * 100).toFixed(0)}% match
                </Badge>
                <Button
                  type="button"
                  size="sm"
                  disabled={pending}
                  onClick={() => confirm(match.referenceId)}
                >
                  Confirm this match
                </Button>
              </div>
            ))}
          </div>
        )}
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => confirm(null)}>
          None of these — no match
        </Button>
      </CardContent>
    </Card>
  );
}
