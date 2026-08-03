import OpenAI from "openai";
import {
  AIVisionConfigurationError,
  type AIVisionProvider,
  type EmbedImageParams,
  type EmbedImageResult,
} from "./types";

export interface OpenAIVisionProviderOptions {
  apiKey: string;
  /** Vision model used to describe the image before embedding it. */
  visionModel?: string;
  /** Embedding model — must match AI_EMBEDDING_DIMENSIONS (1536) in packages/database/src/schema/ai-photo-search.ts. */
  embeddingModel?: string;
}

/**
 * Two-step vision pipeline: GPT-4o-class vision model describes the image
 * (furniture style, fabric pattern, color, construction details), then
 * text-embedding-3-small embeds that description. Embedding a rich text
 * description (rather than raw pixels) keeps this on OpenAI's stable,
 * widely-available API surface instead of a bespoke CLIP deployment.
 */
export class OpenAIVisionProvider implements AIVisionProvider {
  readonly isConfigured = true;
  private readonly client: OpenAI;
  private readonly visionModel: string;
  private readonly embeddingModel: string;

  constructor(options: OpenAIVisionProviderOptions) {
    this.client = new OpenAI({ apiKey: options.apiKey });
    this.visionModel = options.visionModel ?? "gpt-4o-mini";
    this.embeddingModel = options.embeddingModel ?? "text-embedding-3-small";
  }

  async embedImage({ image, contentType }: EmbedImageParams): Promise<EmbedImageResult> {
    const base64 = image.toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;

    const description = await this.client.chat.completions.create({
      model: this.visionModel,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this upholstery/furniture photo in detail: furniture type, fabric pattern, color, texture, and any distinguishing construction details. Be concise but specific — this description is used for similarity search against a catalog.",
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      max_tokens: 300,
    });

    const text = description.choices[0]?.message?.content?.trim() ?? "";

    const embeddingResponse = await this.client.embeddings.create({
      model: this.embeddingModel,
      input: text || "unlabeled furniture photo",
    });

    const embedding = embeddingResponse.data[0]?.embedding;
    if (!embedding) {
      throw new Error("OpenAI did not return an embedding.");
    }

    return { embedding, description: text };
  }
}

/**
 * No-op AIVisionProvider used when OPENAI_API_KEY is unset. Throws
 * AIVisionConfigurationError so the upload/search UI can surface a clear
 * "AI photo search is not configured" state instead of crashing.
 */
export function createNullAIVisionProvider(): AIVisionProvider {
  return {
    isConfigured: false,
    async embedImage() {
      throw new AIVisionConfigurationError();
    },
  };
}

export function createAIVisionProvider(env: { OPENAI_API_KEY?: string }): AIVisionProvider {
  if (!env.OPENAI_API_KEY) {
    return createNullAIVisionProvider();
  }
  return new OpenAIVisionProvider({ apiKey: env.OPENAI_API_KEY });
}
