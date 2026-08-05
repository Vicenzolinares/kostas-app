import Image from "next/image";
import { History } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@kostas/ui";
import { listRecentPhotoSearches } from "../api/queries";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  matched: "Matched",
  no_match: "No match",
  confirmed: "Confirmed",
  rejected: "Dismissed",
};

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "confirmed") return "default";
  if (status === "matched") return "secondary";
  return "outline";
}

/**
 * Deck p13's "Recent Searches" rail, built from the real `photo_searches`
 * rows rather than a static list. The deck labels each entry with a
 * project and item ("Smith Home - Chair #1001"); a search only records the
 * reference it was confirmed against, so unconfirmed rows show their
 * status instead of a borrowed name.
 */
export async function RecentSearches() {
  const searches = await listRecentPhotoSearches();

  return (
    <Card data-testid="recent-searches">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <History className="size-4 text-muted-foreground" aria-hidden />
          Recent searches
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {searches.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No photo searches yet.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {searches.map((search) => {
              const confidence = search.confidenceScore
                ? `${Math.round(Number(search.confidenceScore) * 100)}%`
                : null;
              return (
                <li key={search.id} className="flex items-center gap-3 py-3">
                  <div className="relative size-11 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                    <Image
                      src={`/api/storage/${search.storageKey}`}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="truncate text-sm font-medium">
                      {search.matchedLabel ??
                        STATUS_LABEL[search.status] ??
                        search.status}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {search.createdAt.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge
                      variant={statusVariant(search.status)}
                      className="whitespace-nowrap"
                    >
                      {STATUS_LABEL[search.status] ?? search.status}
                    </Badge>
                    {confidence ? (
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {confidence} confidence
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
