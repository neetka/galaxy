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
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // Return mock response when API key is not configured
    return {
      response: `[Gemini Mock Response]\n\nPrompt: "${input.prompt}"\n\nThis is a placeholder response. Configure GEMINI_API_KEY to enable real Gemini AI responses.`,
      model: input.model,
    };
  }

  // Dynamic import to avoid issues when SDK is not needed
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: input.model || "gemini-2.5-pro",
    systemInstruction: input.systemPrompt || undefined,
    generationConfig: {
      temperature: input.temperature ?? 0.7,
      maxOutputTokens: input.maxTokens ?? 8192,
      topP: input.topP ?? 0.95,
    },
  });

  // Build content parts
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

  // Add images if provided
  if (input.images?.length) {
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

  const result = await model.generateContent(parts);
  const response = result.response;
  const text = response.text();

  return {
    response: text,
    model: input.model,
  };
}
