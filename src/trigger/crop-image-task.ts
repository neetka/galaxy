/**
 * Crop Image Task — Trigger.dev task definition
 *
 * Receives an image buffer and crop parameters (X%, Y%, W%, H%),
 * performs crop via FFmpeg, and returns the cropped image.
 *
 * IMPORTANT: Includes a mandatory 30-second artificial delay
 * to simulate real-world processing time.
 */

// Note: This file is scaffolded for Trigger.dev v3.
// To activate, configure TRIGGER_SECRET_KEY and run `npx trigger.dev@latest dev`

export interface CropImageInput {
  imageBase64: string;
  x: number;      // percentage 0-100
  y: number;      // percentage 0-100
  width: number;  // percentage 0-100
  height: number; // percentage 0-100
}

export interface CropImageOutput {
  croppedImageBase64: string;
  originalWidth: number;
  originalHeight: number;
  cropWidth: number;
  cropHeight: number;
}

/**
 * Simulate crop image processing with 30-second delay.
 * In production, this would use Trigger.dev's task system and FFmpeg.
 */
export async function executeCropImage(
  input: CropImageInput
): Promise<CropImageOutput> {
  // ── Mandatory 30-second artificial delay ──
  await new Promise((resolve) => setTimeout(resolve, 30000));

  // In production: decode base64 → FFmpeg crop → re-encode
  // For now, return the input image with crop metadata
  return {
    croppedImageBase64: input.imageBase64,
    originalWidth: 1920,
    originalHeight: 1080,
    cropWidth: Math.round(1920 * (input.width / 100)),
    cropHeight: Math.round(1080 * (input.height / 100)),
  };
}
