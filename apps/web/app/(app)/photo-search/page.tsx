import { PhotoUpload } from "@/app/(modules)/photo-search/components/photo-upload";
import { aiVisionProvider } from "@/lib/ai-vision";

export default function PhotoSearchPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">AI Photo Search</h1>
        <p className="text-sm text-muted-foreground">
          Upload a photo to find matching catalog items or fabrics by visual similarity.
        </p>
        {!aiVisionProvider.isConfigured ? (
          <p className="mt-1 text-sm text-amber-600">
            AI photo search isn&apos;t configured yet — set OPENAI_API_KEY to enable matching. Uploads are
            still accepted and stored.
          </p>
        ) : null}
      </div>
      <PhotoUpload />
    </div>
  );
}
