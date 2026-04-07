import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, generateObject, streamText, type GenerateTextResult } from "ai";

/**
 * Gemini Key Rotation Utility
 * Automatically switches between multiple API keys when a rate limit (429) is hit.
 */

// Parse keys from environment
// Strategy: Look for GOOGLE_GENERATIVE_AI_API_KEYS (comma separated) 
// or multiple GOOGLE_GENERATIVE_AI_API_KEY_1, _2, etc.
const getKeys = (): string[] => {
  const keysStr = process.env.GOOGLE_GENERATIVE_AI_API_KEYS;
  if (keysStr) {
    return keysStr.split(",").map(k => k.trim()).filter(Boolean);
  }

  // Fallback: look for individual numbered keys
  const keys: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const k = process.env[`GOOGLE_GENERATIVE_AI_API_KEY_${i}`];
    if (k) keys.push(k.trim());
  }

  // Final fallback: the original single key
  const singleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (singleKey && keys.length === 0) {
    keys.push(singleKey.trim());
  }

  return keys;
};

const API_KEYS = getKeys();
let currentKeyIndex = 0;

/**
 * Get a Google Power AI instance with the current key
 */
export const getGoogleProvider = (index: number) => {
  const key = API_KEYS[index % API_KEYS.length];
  if (!key) throw new Error("No Gemini API Keys found in .env");
  
  return createGoogleGenerativeAI({
    apiKey: key,
  });
};

/**
 * Wrapper for generateText with automatic key rotation on 429
 */
export async function generateTextWithRotation(params: any): Promise<GenerateTextResult<any, any>> {
  let lastError: any = null;
  const maxRetries = API_KEYS.length; // Thử tất cả keys, không giới hạn 5

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const index = (currentKeyIndex + attempt) % API_KEYS.length;
    const provider = getGoogleProvider(index);
    
    try {
      // Create a copy of params and inject the rotated model
      const { model: modelName, ...rest } = params;
      // gemini-1.5-flash không có trên v1beta endpoint của SDK này
      // gemini-2.0-flash là model ổn định nhất trong v1beta
      // gemini-2.5-flash là model tốt nhất nhưng quota hết nhanh
      const resolvedModel = modelName || "gemini-2.0-flash";
      const result = await generateText({
        model: provider(resolvedModel),
        ...rest,
      });

      // If successful, update the global index to the one that worked (optional optimization)
      currentKeyIndex = index;
      return result;
    } catch (err: any) {
      lastError = err;
      const statusCode = err?.status || err?.statusCode || 0;
      const errMsg = err?.message || String(err);
      const isRateLimit = statusCode === 429 || errMsg.includes("429");
      const isInvalidKey = statusCode === 401 || statusCode === 403 || errMsg.includes("API key");
      
      console.warn(`[Gemini Rotation] Key ${index + 1} failed. Status: ${statusCode}. Error: ${errMsg}`);

      if ((isRateLimit || isInvalidKey) && API_KEYS.length > 1) {
        console.warn(`[Gemini Rotation] Switching to next key...`);
        continue;
      }
      
      throw err;
    }
  }

  if (lastError) {
    console.error("[geminiClient] All retries failed. Last error info:", lastError?.message || lastError);
    throw lastError;
  }
  throw new Error("Failed to generate text with rotation: No keys available");
}
