import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
import { eq } from "drizzle-orm";
import { db, photoSearches } from "@kostas/database";
import { AIVisionConfigurationError } from "@kostas/shared/ai-vision";
import { authProvider } from "@/lib/auth";
import { storageProvider } from "@/lib/storage";
import { aiVisionProvider } from "@/lib/ai-vision";
import { aiVisionDemoMode } from "@/lib/demo-mode";
import { findDemoMatches, DEMO_MATCH_THRESHOLD } from "@/lib/demo-photo-match";
import { findSimilarPhotos } from "@/app/(modules)/photo-search/api/queries";

const MAX_DIMENSION = 1024;

/**
 * Full upload -> optimize -> AI vision -> pgvector similarity search
 * pipeline for module 12. Runs as a route handler (not a server action)
 * since it accepts multipart file data.
 *
 * When OPENAI_API_KEY is unset the module runs in demo mode: upload, Sharp
 * optimization and local storage are unchanged, but ranking falls back to a
 * local colour-similarity heuristic (see lib/demo-photo-match) instead of
 * calling a model. `embedding` stays null in that case — a fake vector
 * would poison the pgvector index for real searches later.
 *
 * The configured path below is untouched and takes over as soon as a key
 * exists.
 */
export async function POST(request: NextRequest) {
  const session = await authProvider.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());

  // Optimize with Sharp: resize down to a max dimension and re-encode as
  // JPEG, both to bound the payload sent to the vision API and to keep
  // storage costs down.
  const optimized = await sharp(inputBuffer)
    .rotate()
    .resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 82 })
    .toBuffer();

  const uploadResult = await storageProvider.upload(optimized, {
    folder: "photo-search",
    fileName: `${Date.now()}.jpg`,
    contentType: "image/jpeg",
  });

  const [search] = await db
    .insert(photoSearches)
    .values({ storageKey: uploadResult.key, status: "pending" })
    .returning();

  if (!search) {
    return NextResponse.json(
      { error: "Failed to record upload" },
      { status: 500 },
    );
  }

  if (aiVisionDemoMode) {
    const { matches, description } = await findDemoMatches(optimized);
    const topMatch = matches[0];
    const status =
      topMatch && topMatch.similarity >= DEMO_MATCH_THRESHOLD
        ? "matched"
        : "no_match";

    await db
      .update(photoSearches)
      .set({
        topMatches: JSON.stringify(matches),
        confidenceScore: topMatch ? String(topMatch.similarity) : null,
        status,
      })
      .where(eq(photoSearches.id, search.id));

    return NextResponse.json({
      id: search.id,
      status,
      description,
      matches,
      demoMode: true,
    });
  }

  try {
    const { embedding, description } = await aiVisionProvider.embedImage({
      image: optimized,
      contentType: "image/jpeg",
    });

    const matches = await findSimilarPhotos(embedding);
    const topMatch = matches[0];
    const status =
      topMatch && topMatch.similarity >= 0.8 ? "matched" : "no_match";

    await db
      .update(photoSearches)
      .set({
        embedding,
        topMatches: JSON.stringify(matches),
        confidenceScore: topMatch ? String(topMatch.similarity) : null,
        status,
      })
      .where(eq(photoSearches.id, search.id));

    return NextResponse.json({
      id: search.id,
      status,
      description,
      matches,
    });
  } catch (err) {
    if (err instanceof AIVisionConfigurationError) {
      return NextResponse.json(
        { id: search.id, status: "pending", error: err.message },
        { status: 200 },
      );
    }
    await db
      .update(photoSearches)
      .set({
        status: "no_match",
        errorMessage: err instanceof Error ? err.message : String(err),
      })
      .where(eq(photoSearches.id, search.id));
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 },
    );
  }
}
