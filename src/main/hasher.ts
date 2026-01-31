import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import sharp from 'sharp';
import { createHash } from 'crypto';
import { tmpdir } from 'os';
import { join } from 'path';
import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import type { FileInfo, AppMode } from './types';

// Set FFmpeg paths
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}
ffmpeg.setFfprobePath(ffprobeStatic.path);

/**
 * Gets video metadata including duration
 */
export async function getVideoMetadata(filePath: string): Promise<{
  duration: number;
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const duration = metadata.format.duration || 0;
      const width = videoStream?.width || 0;
      const height = videoStream?.height || 0;

      resolve({ duration, width, height });
    });
  });
}

/**
 * Extracts a frame from a video at a specific timestamp and returns the buffer
 * Uses 64x64 for better quality comparison, then normalizes with sharp
 */
async function extractFrame(filePath: string, timestamp: number): Promise<Buffer> {
  const tempFile = join(tmpdir(), `vidcompare_frame_${randomUUID()}.png`);

  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .seekInput(timestamp)
      .frames(1)
      // Extract at higher resolution, normalize aspect ratio to square
      .outputOptions(['-vf', 'scale=64:64:force_original_aspect_ratio=increase,crop=64:64'])
      .output(tempFile)
      .on('end', async () => {
        try {
          const buffer = await fs.readFile(tempFile);
          await fs.unlink(tempFile).catch(() => {}); // Clean up
          resolve(buffer);
        } catch (err) {
          reject(err);
        }
      })
      .on('error', (err) => {
        fs.unlink(tempFile).catch(() => {}); // Clean up on error
        reject(err);
      })
      .run();
  });
}

/**
 * Generates a perceptual hash from an image buffer
 * Uses 16x16 for a more robust hash (256 bits = 64 hex chars)
 * Smaller size is more tolerant of quality differences
 */
async function generatePHash(buffer: Buffer): Promise<string> {
  // Resize to 16x16 grayscale - smaller size is more forgiving of quality differences
  const resized = await sharp(buffer)
    .resize(16, 16, { fit: 'fill' })
    .grayscale()
    .normalize() // Normalize contrast to handle different exposures/quality
    .raw()
    .toBuffer();

  const pixels = Array.from(resized);
  const avg = pixels.reduce((sum, p) => sum + p, 0) / pixels.length;

  // Create hash based on whether each pixel is above or below average
  let hash = '';
  for (const pixel of pixels) {
    hash += pixel > avg ? '1' : '0';
  }

  // Convert binary string to hex for compact storage (256 bits = 64 hex chars)
  const hexHash = BigInt('0b' + hash).toString(16).padStart(64, '0');
  return hexHash;
}

/**
 * Calculates Hamming distance between two hex hashes
 */
export function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) {
    return Infinity;
  }

  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    const n1 = parseInt(hash1[i], 16);
    const n2 = parseInt(hash2[i], 16);
    const xor = n1 ^ n2;
    // Count set bits in XOR result
    distance += xor.toString(2).split('1').length - 1;
  }

  return distance;
}

/**
 * Generates a 3-point fingerprint for a video
 * Extracts frames at 10%, 50%, and 90% of duration
 */
export async function generateVideoFingerprint(filePath: string): Promise<string> {
  try {
    const { duration } = await getVideoMetadata(filePath);

    if (duration < 1) {
      // Very short video, use single frame
      const frame = await extractFrame(filePath, 0);
      const hash = await generatePHash(frame);
      return `${hash}-${hash}-${hash}`;
    }

    const timestamps = [
      duration * 0.1,
      duration * 0.5,
      duration * 0.9
    ];

    const hashes: string[] = [];

    for (const timestamp of timestamps) {
      const frame = await extractFrame(filePath, timestamp);
      const hash = await generatePHash(frame);
      hashes.push(hash);
    }

    return hashes.join('-');
  } catch (err) {
    console.error(`Failed to generate fingerprint for ${filePath}:`, err);
    throw err;
  }
}

/**
 * Generates a perceptual hash for an image file
 */
export async function generateImageFingerprint(filePath: string): Promise<string> {
  try {
    const buffer = await fs.readFile(filePath);
    return await generatePHash(buffer);
  } catch (err) {
    console.error(`Failed to generate fingerprint for ${filePath}:`, err);
    throw err;
  }
}

/**
 * Generates a fingerprint based on the mode
 */
export async function generateFingerprint(filePath: string, mode: AppMode): Promise<string> {
  if (mode === 'video') {
    return generateVideoFingerprint(filePath);
  } else {
    return generateImageFingerprint(filePath);
  }
}

/**
 * Generates a thumbnail for a file
 */
export async function generateThumbnail(filePath: string, mode: AppMode): Promise<string> {
  const tempFile = join(tmpdir(), `vidcompare_thumb_${randomUUID()}.jpg`);

  if (mode === 'video') {
    return new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .seekInput(1) // Seek to 1 second to avoid black frames
        .frames(1)
        .outputOptions(['-vf', 'scale=320:-1'])
        .output(tempFile)
        .on('end', () => resolve(tempFile))
        .on('error', reject)
        .run();
    });
  } else {
    // For images, create a thumbnail using sharp
    await sharp(filePath)
      .resize(320, 320, { fit: 'inside' })
      .jpeg({ quality: 80 })
      .toFile(tempFile);
    return tempFile;
  }
}

/**
 * Compares two video fingerprints
 * Returns true if they match (at least 2 out of 3 frame hashes are similar)
 * More lenient matching to catch quality variants (upscaled, re-encoded, etc.)
 *
 * With 256-bit hash (16x16), threshold of 40 = ~15% bit difference allowed per frame
 */
export function compareVideoFingerprints(fp1: string, fp2: string, threshold: number = 40): boolean {
  const hashes1 = fp1.split('-');
  const hashes2 = fp2.split('-');

  if (hashes1.length !== hashes2.length) {
    return false;
  }

  // Count how many frames match
  let matchingFrames = 0;
  let totalDistance = 0;

  for (let i = 0; i < hashes1.length; i++) {
    const distance = hammingDistance(hashes1[i], hashes2[i]);
    totalDistance += distance;
    if (distance <= threshold) {
      matchingFrames++;
    }
  }

  // Match if at least 2 out of 3 frames are similar
  // OR if average distance across all frames is low enough
  const avgDistance = totalDistance / hashes1.length;
  return matchingFrames >= 2 || avgDistance <= threshold * 0.7;
}

/**
 * Compares two image fingerprints
 * Returns true if Hamming distance is within threshold
 * With 256-bit hash, threshold of 25 = ~10% bit difference allowed
 */
export function compareImageFingerprints(fp1: string, fp2: string, threshold: number = 25): boolean {
  const distance = hammingDistance(fp1, fp2);
  return distance <= threshold;
}

/**
 * Groups files by visual similarity using fingerprints
 * Uses more lenient thresholds to catch quality variants
 */
export function groupByVisualSimilarity(
  files: FileInfo[],
  mode: AppMode,
  threshold?: number
): Map<string, FileInfo[]> {
  const groups: FileInfo[][] = [];
  const assigned = new Set<string>();

  const compareFunc = mode === 'video' ? compareVideoFingerprints : compareImageFingerprints;
  // Higher thresholds to catch upscaled/re-encoded/quality variants
  const defaultThreshold = mode === 'video' ? 40 : 25;
  const actualThreshold = threshold ?? defaultThreshold;

  for (const file of files) {
    if (assigned.has(file.id) || !file.fingerprint) {
      continue;
    }

    const group: FileInfo[] = [file];
    assigned.add(file.id);

    for (const other of files) {
      if (assigned.has(other.id) || !other.fingerprint || other.id === file.id) {
        continue;
      }

      if (compareFunc(file.fingerprint, other.fingerprint, actualThreshold)) {
        group.push(other);
        assigned.add(other.id);
      }
    }

    if (group.length > 1) {
      groups.push(group);
    }
  }

  // Convert to Map format
  const result = new Map<string, FileInfo[]>();
  groups.forEach((group, index) => {
    result.set(`visual_group_${index}`, group);
  });

  return result;
}
