export type AppMode = 'video' | 'image';

export interface FileInfo {
  id: string;
  path: string;
  fileName: string;
  normalizedName: string;
  size: number;
  extension: string;
  duration?: number; // For videos
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

export interface IpcChannels {
  'select-folder': () => Promise<string | null>;
  'start-scan': (folderPath: string, mode: AppMode) => Promise<void>;
  'scan-progress': (callback: (progress: ScanProgress) => void) => void;
  'scan-complete': (callback: (result: ScanResult) => void) => void;
  'delete-files': (filePaths: string[]) => Promise<{ success: boolean; errors: string[] }>;
  'get-video-duration': (filePath: string) => Promise<number>;
  'generate-thumbnail': (filePath: string, mode: AppMode) => Promise<string>;
}
