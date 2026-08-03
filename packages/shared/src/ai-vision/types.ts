export interface EmbedImageParams {
  /** Raw image bytes, already optimized (e.g. via Sharp) before this call. */
  image: Buffer;
  contentType: string;
}

export interface EmbedImageResult {
  embedding: number[];
  description: string;
}

/**
 * Abstraction over an AI vision backend so packages/database and the
 * photo-search module can be built/typechecked without a live OpenAI key.
 * Mirrors the AuthProvider/StorageProvider pattern in packages/auth and
 * packages/shared/storage. The OpenAI-backed implementation reads
 * OPENAI_API_KEY; when unset, `createNullAIVisionProvider()` is used
 * instead and throws a clear AIVisionConfigurationError on every call.
 */
export interface AIVisionProvider {
  readonly isConfigured: boolean;
  /** Produces a description + embedding vector for similarity search. */
  embedImage(params: EmbedImageParams): Promise<EmbedImageResult>;
}

export class AIVisionConfigurationError extends Error {
  constructor(message = "AI photo search is not configured. Set OPENAI_API_KEY to enable it.") {
    super(message);
    this.name = "AIVisionConfigurationError";
  }
}
