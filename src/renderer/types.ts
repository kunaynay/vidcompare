export type AppMode = 'video' | 'image';

export interface FileInfo {
  id: string;
  path: string;
  fileName: string;
  normalizedName: string;
  size: number;
  extension: string;
  duration?: number;
  width?: number;
  height?: number;
  fingerprint?: string;
  thumbnailPath?: string;
}

export interface DuplicateSet {
  id: string;
  normalizedName: string;
  files: FileInfo[];
  matchType: 'lazy' | 'visual';
  thumbnail?: string;
}

export interface ScanProgress {
  phase: 'scanning' | 'hashing' | 'grouping' | 'complete';
  current: number;
  total: number;
  currentFile?: string;
}

export interface ScanResult {
  duplicateSets: DuplicateSet[];
  totalFilesScanned: number;
  totalDuplicatesFound: number;
  spaceSavings: number;
}

// Electron API types
export interface ElectronAPI {
  selectFolder: () => Promise<string | null>;
  startScan: (folderPath: string, mode: AppMode) => Promise<void>;
  cancelScan: () => Promise<void>;
  deleteFiles: (filePaths: string[]) => Promise<{ success: boolean; errors: string[] }>;
  getVideoDuration: (filePath: string) => Promise<number>;
  generateThumbnail: (filePath: string, mode: AppMode) => Promise<string>;
  onScanProgress: (callback: (progress: ScanProgress) => void) => () => void;
  onScanComplete: (callback: (result: ScanResult) => void) => () => void;
  onScanError: (callback: (error: string) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
