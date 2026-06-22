/**
 * Gemini Task — Trigger.dev task definition
 *
 * Uses @google/generative-ai to call Gemini 3.1 Pro
 * with optional multimodal inputs (images, video, audio, files).
 */

// Note: This file is scaffolded for Trigger.dev v3.
// To activate, configure TRIGGER_SECRET_KEY and GEMINI_API_KEY

export interface GeminiTaskInput {
  model: string;
  prompt: string;
  systemPrompt?: string;
  images?: string[];     // base64 encoded
  video?: string;        // base64 encoded
  audio?: string;        // base64 encoded
  file?: string;         // base64 encoded
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface GeminiTaskOutput {
  response: string;
  tokenCount?: number;
  model: string;
}

/**
 * Execute Gemini AI generation.
 * In production, uses @google/generative-ai SDK.
 */
export async function executeGemini(
  input: GeminiTaskInput
): Promise<GeminiTaskOutput> {
  // Validate and sanitize model (prefer gemini-2.0-flash for free tier)
  const validModels = ["gemini-2.0-flash", "gemini-2.5-pro", "gemini-1.5-pro", "gemini-1.5-flash"];
  const sanitizedModel = validModels.includes(input.model) ? input.model : "gemini-2.0-flash";
  
  console.log("[executeGemini] Starting with input:", {
    originalModel: input.model,
    sanitizedModel,
    prompt: input.prompt.substring(0, 100) + "...",
    hasImages: !!input.images?.length,
  });
  
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("[executeGemini] API key exists:", !!apiKey);

  // Helper to create a friendly mock/fallback response
  const getFallbackResponse = (reason: string) => ({
    response: `[Gemini Fallback Response]\n\nReason: ${reason}\n\nPrompt: "${input.prompt}"\n\nThis is a placeholder response while Gemini is unavailable.`,
    model: sanitizedModel,
  });

  if (!apiKey) {
    console.warn("[executeGemini] No API key found, returning mock response");
    return getFallbackResponse("No API key configured");
  }

  try {
    // Dynamic import to avoid issues when SDK is not needed
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    console.log("[executeGemini] Successfully imported GoogleGenerativeAI");
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: sanitizedModel,
      systemInstruction: input.systemPrompt || undefined,
      generationConfig: {
        temperature: input.temperature ?? 0.7,
        maxOutputTokens: input.maxTokens ?? 8192,
        topP: input.topP ?? 0.95,
      },
    });

    console.log("[executeGemini] Model initialized:", sanitizedModel);

    // Build content parts
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

    // Add images if provided
    if (input.images?.length) {
      console.log("[executeGemini] Adding", input.images.length, "image(s)");
      for (const imageBase64 of input.images) {
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64,
          },
        });
      }
    }

    // Add prompt text
    parts.push({ text: input.prompt });
    console.log("[executeGemini] Calling generateContent with", parts.length, "part(s)");

    const result = await model.generateContent(parts);
    const response = result.response;
    const text = response.text();

    console.log("[executeGemini] Successfully got response, length:", text.length);

    return {
      response: text,
      model: sanitizedModel,
    };
  } catch (err) {
    console.error("[executeGemini] ERROR:", err);
    const errorStr = err instanceof Error ? err.message : String(err);
    
    // Provide clear, actionable error messages for known failure modes
    if (errorStr.includes("429") || errorStr.includes("Quota exceeded")) {
      throw new Error("Gemini API quota exceeded. Please wait and try again, or switch to a different model.");
    }
    
    if (errorStr.includes("400") || errorStr.includes("INVALID_ARGUMENT")) {
      throw new Error(`Gemini rejected the input: ${errorStr.substring(0, 200)}`);
    }

    if (errorStr.includes("403") || errorStr.includes("PERMISSION_DENIED")) {
      throw new Error("Gemini API key does not have permission for this model. Check your API key settings.");
    }

    // Re-throw with a clean message for any other error
    throw new Error(`Gemini API error: ${errorStr.substring(0, 200)}`);
  }
}
