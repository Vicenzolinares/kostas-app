"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Layers,
  MapPin,
  Package,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Badge, Button, Card, CardContent } from "@kostas/ui";
import { FabricSwatch } from "@/lib/fabric-color";
import { confirmPhotoMatchAction } from "../api/actions";
import type { EnrichedPhotoMatch } from "../types";

interface MatchReviewProps {
  searchId: string;
  /** Server-side summary of how the ranking was produced. */
  description?: string;
  /** True when ranking came from the local colour heuristic, not a model. */
  demoMode?: boolean;
  /** "matched" once the top candidate clears the confidence threshold. */
  status?: string;
  matches: EnrichedPhotoMatch[];
}

function photoSrc(storageKey: string): string {
  return storageKey.startsWith("/") ? storageKey : `/api/storage/${storageKey}`;
}

function percent(similarity: number): string {
  return `${Math.round(similarity * 100)}%`;
}

/** Icon per detail row, mirroring the deck's leading glyphs. */
function DetailIcon({ kind }: { kind: "item" | "fabric" }) {
  const Icon = kind === "fabric" ? Layers : Package;
  return <Icon className="size-4 text-muted-foreground" aria-hidden />;
}

export function MatchReview({
  searchId,
  description,
  demoMode,
  status,
  matches,
}: MatchReviewProps) {
  const [pending, startTransition] = useTransition();
  const [decision, setDecision] = useState<"confirmed" | "rejected" | null>(
    null,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const top = matches.find((m) => m.referenceId === selectedId) ?? matches[0];
  const others = matches.filter((m) => m.referenceId !== top?.referenceId);
  const isMatch = status === "matched";

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
      <Card data-testid="match-decision">
        <CardContent className="flex items-center gap-3 pt-6 text-sm">
          {decision === "confirmed" ? (
            <>
              <CheckCircle2
                className="size-5 text-emerald-600 dark:text-emerald-400"
                aria-hidden
              />
              <span>Match confirmed and saved to this search.</span>
            </>
          ) : (
            <>
              <XCircle className="size-5 text-muted-foreground" aria-hidden />
              <span>No match recorded — search dismissed.</span>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!top) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          No reference photos in the catalog to compare against yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Card className="overflow-hidden" data-testid="match-review">
        {/* Confidence banner — the deck leads with the score, not the record. */}
        <div
          className={`flex flex-wrap items-center gap-4 border-b px-6 py-5 ${
            isMatch
              ? "border-emerald-600/20 bg-emerald-50/70 dark:border-emerald-400/20 dark:bg-emerald-500/10"
              : "border-amber-600/20 bg-amber-50/70 dark:border-amber-400/20 dark:bg-amber-500/10"
          }`}
          data-testid="confidence-banner"
        >
          {isMatch ? (
            <CheckCircle2
              className="size-9 shrink-0 stroke-[1.5] text-emerald-600 dark:text-emerald-400"
              aria-hidden
            />
          ) : (
            <XCircle
              className="size-9 shrink-0 stroke-[1.5] text-amber-600 dark:text-amber-400"
              aria-hidden
            />
          )}

          <div className="flex items-baseline gap-2">
            <span
              className={`text-4xl font-semibold leading-none tracking-tight tabular-nums ${
                isMatch
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-amber-700 dark:text-amber-300"
              }`}
              data-testid="confidence-percent"
            >
              {percent(top.similarity)}
            </span>
            <span
              className={`text-sm font-medium ${
                isMatch
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-amber-700 dark:text-amber-300"
              }`}
            >
              Confidence
            </span>
          </div>

          <div className="min-w-[12rem] flex-1">
            <p className="text-base font-semibold">
              {isMatch ? "Possible match found" : "No confident match"}
            </p>
            {/* Never let the big number imply more than it is. */}
            <p className="text-xs text-muted-foreground">
              {demoMode
                ? "Weighted-RGB colour similarity against the seeded catalog — not semantic AI matching."
                : "Visual-similarity score from the AI vision model."}
            </p>
          </div>
        </div>

        <CardContent className="flex flex-col gap-5 pt-6">
          <div className="flex flex-col gap-5 sm:flex-row">
            {/* self-start: without it the row's stretch alignment overrides
                aspect-square and the thumbnail grows to the card's height. */}
            <div className="relative aspect-square w-full shrink-0 self-start overflow-hidden rounded-md border border-border bg-muted sm:w-44">
              <Image
                src={photoSrc(top.storageKey)}
                alt={top.label ?? "Reference photo"}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            <dl className="flex min-w-0 flex-1 flex-col gap-3 text-sm">
              {top.detail ? (
                <>
                  <div className="flex items-start gap-3">
                    <DetailIcon kind={top.detail.kind} />
                    <dt className="w-28 shrink-0 text-muted-foreground">
                      {top.detail.kind === "fabric" ? "Fabric" : "Item"}
                    </dt>
                    <dd className="min-w-0 font-medium">
                      {top.detail.code}
                      <span className="block text-xs font-normal text-muted-foreground">
                        {top.detail.title}
                      </span>
                    </dd>
                  </div>

                  {top.detail.colorName ? (
                    <div className="flex items-start gap-3">
                      <Layers className="size-4 text-transparent" aria-hidden />
                      <dt className="w-28 shrink-0 text-muted-foreground">
                        Colour
                      </dt>
                      <dd className="flex min-w-0 items-center gap-2 font-medium">
                        <FabricSwatch color={top.detail.colorName} size={16} />
                        {top.detail.colorName}
                      </dd>
                    </div>
                  ) : null}

                  {top.detail.fields.map((field) => (
                    <div key={field.label} className="flex items-start gap-3">
                      {field.label === "Location" ? (
                        <MapPin
                          className="size-4 text-muted-foreground"
                          aria-hidden
                        />
                      ) : (
                        <Layers className="size-4 text-transparent" aria-hidden />
                      )}
                      <dt className="w-28 shrink-0 text-muted-foreground">
                        {field.label}
                      </dt>
                      <dd className="min-w-0 font-medium">{field.value}</dd>
                    </div>
                  ))}

                  <Link
                    href={top.detail.href}
                    className="ml-7 w-fit text-xs font-medium text-primary hover:underline"
                  >
                    View in{" "}
                    {top.detail.kind === "fabric"
                      ? "Fabric Inventory"
                      : "Items & Inventory"}
                  </Link>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {top.label ?? "Untitled reference photo"} — this reference
                  isn&apos;t linked to a catalog item or fabric.
                </p>
              )}
            </dl>
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => confirm(null)}
            >
              Not this item
            </Button>
            <Button
              type="button"
              disabled={pending}
              onClick={() => confirm(top.referenceId)}
            >
              {pending ? "Saving…" : "Confirm match"}
            </Button>
          </div>

          {others.length > 0 ? (
            <div className="flex flex-col gap-3 border-t border-border pt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Other candidates
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {others.map((match) => (
                  <button
                    key={match.referenceId}
                    type="button"
                    onClick={() => setSelectedId(match.referenceId)}
                    className="flex flex-col items-start gap-2 rounded-md border border-border p-2 text-left transition-colors hover:border-primary/60 hover:bg-accent/50"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded bg-muted">
                      <Image
                        src={photoSrc(match.storageKey)}
                        alt={match.label ?? "Reference photo"}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <span className="truncate text-xs font-medium">
                      {match.detail?.code ?? match.label ?? "Untitled"}
                    </span>
                    <Badge variant="outline" className="w-fit tabular-nums">
                      {percent(match.similarity)}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Deck p13's purple explainer panel. Its copy claims confirming
          "automatically tags the photo to all related records"; confirming
          currently only records the decision against this search, so the
          panel says that instead of the thing it can't do. */}
      <Card className="border-primary/20 bg-accent/40">
        <CardContent className="flex flex-col gap-4 pt-6 text-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" aria-hidden />
            <span className="font-semibold text-primary">
              {isMatch ? "Match found" : "Review needed"}
            </span>
          </div>

          <p className="text-muted-foreground">
            {isMatch
              ? "The closest reference photo in the catalog is shown on the left. Confirm it if it's the right record."
              : "Nothing scored above the confidence threshold. Pick a candidate anyway, or dismiss the search."}
          </p>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              Confirming will
            </p>
            <ul className="flex flex-col gap-2">
              <li className="flex items-start gap-2">
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden
                />
                <span>Record this search as matched.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden
                />
                <span>
                  Link it to{" "}
                  <span className="font-medium">
                    {top.detail
                      ? `${top.detail.code} · ${top.detail.title}`
                      : (top.label ?? "the selected reference photo")}
                  </span>
                  .
                </span>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground">
              Auto-tagging the photo onto projects and work orders isn&apos;t
              built yet — confirming records the catalog match only.
            </p>
          </div>

          {description ? (
            <p
              className="border-t border-primary/15 pt-3 text-xs text-muted-foreground"
              data-testid="match-method"
            >
              {description}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
