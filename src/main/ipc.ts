import { ipcMain, dialog, shell, BrowserWindow } from 'electron';
import { randomUUID } from 'crypto';
import { scanDirectory, groupByNameAndSize } from './scanner';
import {
  generateFingerprint,
  generateThumbnail,
  getVideoMetadata,
  groupByVisualSimilarity
} from './hasher';
import type { AppMode, DuplicateSet, FileInfo, ScanResult } from './types';

// Simple concurrency limiter to avoid p-limit ESM issues
function createLimiter(concurrency: number) {
  let activeCount = 0;
  const queue: (() => void)[] = [];

  const next = () => {
    if (queue.length > 0 && activeCount < concurrency) {
      activeCount++;
      const fn = queue.shift()!;
      fn();
    }
  };

  return <T>(fn: () => Promise<T>): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const run = async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          activeCount--;
          next();
        }
      };

      queue.push(run);
      next();
    });
  };
}

// Limit concurrent FFmpeg processes
const limit = createLimiter(4);
let scanCancelled = false;

function getMainWindow(): BrowserWindow | null {
  const windows = BrowserWindow.getAllWindows();
  return windows.length > 0 ? windows[0] : null;
}

function sendProgress(phase: string, current: number, total: number, currentFile?: string) {
  const mainWindow = getMainWindow();
  if (mainWindow) {
    mainWindow.webContents.send('scan-progress', {
      phase,
      current,
      total,
      currentFile
    });
  }
}

function sendComplete(result: ScanResult) {
  const mainWindow = getMainWindow();
  if (mainWindow) {
    mainWindow.webContents.send('scan-complete', result);
  }
}

function sendError(error: string) {
  const mainWindow = getMainWindow();
  if (mainWindow) {
    mainWindow.webContents.send('scan-error', error);
  }
}

export function registerIpcHandlers() {
  // Select folder dialog
  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  // Cancel scan
  ipcMain.handle('cancel-scan', async () => {
    scanCancelled = true;
  });

  // Start scanning
  ipcMain.handle('start-scan', async (_event, folderPath: string, mode: AppMode) => {
    scanCancelled = false;

    try {
      // Phase 1: Scanning files
      sendProgress('scanning', 0, 0);

      let fileCount = 0;
      const files = await scanDirectory(folderPath, mode, (count, file) => {
        fileCount = count;
        sendProgress('scanning', count, 0, file);
      });

      if (scanCancelled) return;

      if (files.length === 0) {
        sendComplete({
          duplicateSets: [],
          totalFilesScanned: 0,
          totalDuplicatesFound: 0,
          spaceSavings: 0
        });
        return;
      }

      // Phase 2: Pass 1 - Lazy Match (Name + Size)
      sendProgress('grouping', 0, files.length);
      const lazyGroups = groupByNameAndSize(files);

      // Phase 3: Pass 2 - Visual Match (Fingerprinting)
      // For videos: fingerprint ALL files to catch quality variants (upscaled, re-encoded)
      // For images: fingerprint ALL files as well for thorough comparison
      const allToFingerprint = files;

      sendProgress('hashing', 0, allToFingerprint.length);

      let hashedCount = 0;
      const hashPromises = allToFingerprint.map(file =>
        limit(async () => {
          if (scanCancelled) return;

          try {
            file.fingerprint = await generateFingerprint(file.path, mode);

            // Get additional metadata for videos
            if (mode === 'video') {
              const meta = await getVideoMetadata(file.path);
              file.duration = meta.duration;
              file.width = meta.width;
              file.height = meta.height;
            }
          } catch (err) {
            console.warn(`Failed to fingerprint: ${file.path}`, err);
          }

          hashedCount++;
          sendProgress('hashing', hashedCount, allToFingerprint.length, file.path);
        })
      );

      await Promise.all(hashPromises);

      if (scanCancelled) return;

      // Group by visual similarity
      const visualGroups = groupByVisualSimilarity(files, mode);

      // Combine lazy and visual groups, removing duplicates
      const allDuplicateSets: DuplicateSet[] = [];
      const usedFileIds = new Set<string>();

      // First, add visual groups (more accurate)
      for (const [key, group] of visualGroups) {
        const setId = randomUUID();
        const uniqueFiles = group.filter(f => !usedFileIds.has(f.id));

        if (uniqueFiles.length >= 2) {
          uniqueFiles.forEach(f => usedFileIds.add(f.id));
          allDuplicateSets.push({
            id: setId,
            normalizedName: uniqueFiles[0].normalizedName,
            files: uniqueFiles,
            matchType: 'visual'
          });
        }
      }

      // Then add lazy groups that weren't caught by visual matching
      for (const [key, group] of lazyGroups) {
        const unusedFiles = group.filter(f => !usedFileIds.has(f.id));

        if (unusedFiles.length >= 2) {
          unusedFiles.forEach(f => usedFileIds.add(f.id));
          allDuplicateSets.push({
            id: randomUUID(),
            normalizedName: unusedFiles[0].normalizedName,
            files: unusedFiles,
            matchType: 'lazy'
          });
        }
      }

      // Calculate space savings (sum of all duplicate sizes except the largest in each set)
      let spaceSavings = 0;
      for (const set of allDuplicateSets) {
        const sortedBySize = [...set.files].sort((a, b) => b.size - a.size);
        // Keep the largest, sum the rest
        for (let i = 1; i < sortedBySize.length; i++) {
          spaceSavings += sortedBySize[i].size;
        }
      }

      const totalDuplicates = allDuplicateSets.reduce(
        (sum, set) => sum + set.files.length - 1,
        0
      );

      sendComplete({
        duplicateSets: allDuplicateSets,
        totalFilesScanned: files.length,
        totalDuplicatesFound: totalDuplicates,
        spaceSavings
      });

    } catch (err) {
      console.error('Scan error:', err);
      sendError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  });

  // Delete files (move to trash)
  ipcMain.handle('delete-files', async (_event, filePaths: string[]) => {
    const errors: string[] = [];

    for (const filePath of filePaths) {
      try {
        await shell.trashItem(filePath);
      } catch (err) {
        errors.push(`Failed to delete ${filePath}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0,
      errors
    };
  });

  // Get video duration
  ipcMain.handle('get-video-duration', async (_event, filePath: string) => {
    try {
      const { duration } = await getVideoMetadata(filePath);
      return duration;
    } catch (err) {
      console.error('Failed to get duration:', err);
      return 0;
    }
  });

  // Generate thumbnail
  ipcMain.handle('generate-thumbnail', async (_event, filePath: string, mode: AppMode) => {
    try {
      return await generateThumbnail(filePath, mode);
    } catch (err) {
      console.error('Failed to generate thumbnail:', err);
      return null;
    }
  });
}
