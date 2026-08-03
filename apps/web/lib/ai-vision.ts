import "server-only";
import { createAIVisionProvider, type AIVisionProvider } from "@kostas/shared/ai-vision";

/**
 * The single AIVisionProvider instance used across apps/web. Falls back
 * to the null provider (every call throws AIVisionConfigurationError)
 * when OPENAI_API_KEY is unset — see packages/shared/src/ai-vision for
 * the abstraction and docs/PROGRESS.md for what's needed to go live.
 */
export const aiVisionProvider: AIVisionProvider = createAIVisionProvider({
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
});
