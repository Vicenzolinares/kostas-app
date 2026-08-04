import { Badge } from "@kostas/ui";
import { PhotoUpload } from "@/app/(modules)/photo-search/components/photo-upload";
import { aiVisionDemoMode } from "@/lib/demo-mode";

export default function PhotoSearchPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">AI Photo Search</h1>
        <p className="text-sm text-muted-foreground">
          Upload a photo to find matching catalog items or fabrics by visual
          similarity.
        </p>
        {aiVisionDemoMode ? (
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="photo-search-status"
          >
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
            >
              Demo Mode — AI vision not connected
            </Badge>
            <span className="text-xs text-muted-foreground">
              Matches are ranked locally by colour similarity against the seeded
              catalog. No model is called; set OPENAI_API_KEY for true visual
              matching.
            </span>
          </div>
        ) : null}
      </div>
      <PhotoUpload />
    </div>
  );
}
