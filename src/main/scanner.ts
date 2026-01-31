import { promises as fs } from 'fs';
import { join, basename, extname } from 'path';
import { randomUUID } from 'crypto';
import type { AppMode, FileInfo } from './types';

const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpeg', '.mpg', '.3gp'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.tif', '.heic', '.heif'];

/**
 * Normalizes a filename for comparison
 * - Strips counters like (1), (2), etc.
 * - Strips "Copy of" prefix
 * - Strips extension
 * - Converts to lowercase
 */
export function normalizeFileName(fileName: string): string {
  let normalized = fileName;

  // Remove extension
  const ext = extname(normalized);
  normalized = normalized.slice(0, -ext.length);

  // Strip counters: video (1), video (2), video_1, video_2, video-1, video-2
  normalized = normalized.replace(/[\s_-]*\(\d+\)\s*$/g, '');
  normalized = normalized.replace(/[\s_-]+\d+\s*$/g, '');

  // Strip "Copy of" prefix (case insensitive)
  normalized = normalized.replace(/^copy\s+of\s+/i, '');

  // Strip common copy suffixes
  normalized = normalized.replace(/[\s_-]*copy\s*\d*$/i, '');

  // Convert to lowercase and trim
  normalized = normalized.toLowerCase().trim();

  // Replace multiple spaces/underscores/dashes with single space
  normalized = normalized.replace(/[\s_-]+/g, ' ');

  return normalized;
}

/**
 * Checks if a file extension matches the current mode
 */
function isValidExtension(extension: string, mode: AppMode): boolean {
  const ext = extension.toLowerCase();
  if (mode === 'video') {
    return VIDEO_EXTENSIONS.includes(ext);
  } else {
    return IMAGE_EXTENSIONS.includes(ext);
  }
}

/**
 * Recursively scans a directory for files matching the mode
 */
export async function scanDirectory(
  dirPath: string,
  mode: AppMode,
  onProgress?: (current: number, currentFile: string) => void
): Promise<FileInfo[]> {
  const files: FileInfo[] = [];
  let count = 0;

  async function scanRecursive(currentPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(currentPath, entry.name);

        if (entry.isDirectory()) {
          // Skip hidden directories and common system folders
          if (!entry.name.startsWith('.') &&
              !['node_modules', '$RECYCLE.BIN', 'System Volume Information'].includes(entry.name)) {
            await scanRecursive(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = extname(entry.name);

          if (isValidExtension(ext, mode)) {
            try {
              const stats = await fs.stat(fullPath);
              count++;

              if (onProgress) {
                onProgress(count, fullPath);
              }

              files.push({
                id: randomUUID(),
                path: fullPath,
                fileName: entry.name,
                normalizedName: normalizeFileName(entry.name),
                size: stats.size,
                extension: ext.toLowerCase()
              });
            } catch (err) {
              // Skip files we can't access
              console.warn(`Could not access file: ${fullPath}`, err);
            }
          }
        }
      }
    } catch (err) {
      console.warn(`Could not access directory: ${currentPath}`, err);
    }
  }

  await scanRecursive(dirPath);
  return files;
}

/**
 * Groups files by normalized name and size (Pass 1: Lazy Match)
 */
export function groupByNameAndSize(files: FileInfo[]): Map<string, FileInfo[]> {
  const groups = new Map<string, FileInfo[]>();

  for (const file of files) {
    // Create a key combining normalized name and file size
    const key = `${file.normalizedName}|${file.size}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(file);
  }

  // Filter to only keep groups with 2+ files (actual duplicates)
  const duplicateGroups = new Map<string, FileInfo[]>();
  for (const [key, group] of groups) {
    if (group.length >= 2) {
      duplicateGroups.set(key, group);
    }
  }

  return duplicateGroups;
}

/**
 * Groups files by their visual fingerprint (Pass 2: Visual Match)
 */
export function groupByFingerprint(files: FileInfo[]): Map<string, FileInfo[]> {
  const groups = new Map<string, FileInfo[]>();

  for (const file of files) {
    if (file.fingerprint) {
      if (!groups.has(file.fingerprint)) {
        groups.set(file.fingerprint, []);
      }
      groups.get(file.fingerprint)!.push(file);
    }
  }

  // Filter to only keep groups with 2+ files
  const duplicateGroups = new Map<string, FileInfo[]>();
  for (const [key, group] of groups) {
    if (group.length >= 2) {
      duplicateGroups.set(key, group);
    }
  }

  return duplicateGroups;
}
