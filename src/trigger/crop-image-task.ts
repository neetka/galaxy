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

import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import ffmpeg from "ffmpeg-static";

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
 * Performs actual crop via FFmpeg.
 */
export async function executeCropImage(
  input: CropImageInput
): Promise<CropImageOutput> {
  // ── Mandatory 30-second artificial delay ──
  await new Promise((resolve) => setTimeout(resolve, 30000));

  const ffmpegPath = ffmpeg;
  if (!ffmpegPath) {
    throw new Error("FFmpeg static binary not found");
  }

  // Parse input image
  let base64Data = input.imageBase64;
  let header = "";
  const matches = input.imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    header = `data:${matches[1]};base64,`;
    base64Data = matches[2];
  }

  const buffer = Buffer.from(base64Data, "base64");
  const tempDir = os.tmpdir();
  const inputPath = path.join(tempDir, `input_${Date.now()}.png`);
  const outputPath = path.join(tempDir, `output_${Date.now()}.png`);

  try {
    // Write input image to temp file
    await fs.promises.writeFile(inputPath, buffer);

    // Call FFmpeg to crop the image
    // crop=width:height:x:y
    // Since x, y, width, height are percentages (0-100), we use FFmpeg filter:
    // crop=(iw*W/100):(ih*H/100):(iw*X/100):(ih*Y/100)
    const filter = `crop=(iw*${input.width}/100):(ih*${input.height}/100):(iw*${input.x}/100):(ih*${input.y}/100)`;

    await new Promise<void>((resolve, reject) => {
      execFile(
        ffmpegPath,
        ["-y", "-i", inputPath, "-vf", filter, outputPath],
        (error: Error | null, stdout: string, stderr: string) => {
          if (error) {
            reject(new Error(`FFmpeg error: ${error.message}. Stderr: ${stderr}`));
          } else {
            resolve();
          }
        }
      );
    });

    // Read cropped image
    const croppedBuffer = await fs.promises.readFile(outputPath);
    const croppedBase64 = header + croppedBuffer.toString("base64");

    return {
      croppedImageBase64: croppedBase64,
      originalWidth: 1920,
      originalHeight: 1080,
      cropWidth: Math.round(1920 * (input.width / 100)),
      cropHeight: Math.round(1080 * (input.height / 100)),
    };
  } finally {
    // Cleanup temp files
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (e) {
      console.warn("Failed to delete temp files:", e);
    }
  }
}
