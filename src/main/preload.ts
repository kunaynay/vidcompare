import { contextBridge, ipcRenderer } from 'electron';
import type { AppMode, ScanProgress, ScanResult } from './types';

const electronAPI = {
  selectFolder: (): Promise<string | null> =>
    ipcRenderer.invoke('select-folder'),

  startScan: (folderPath: string, mode: AppMode): Promise<void> =>
    ipcRenderer.invoke('start-scan', folderPath, mode),

  cancelScan: (): Promise<void> =>
    ipcRenderer.invoke('cancel-scan'),

  deleteFiles: (filePaths: string[]): Promise<{ success: boolean; errors: string[] }> =>
    ipcRenderer.invoke('delete-files', filePaths),

  getVideoDuration: (filePath: string): Promise<number> =>
    ipcRenderer.invoke('get-video-duration', filePath),

  generateThumbnail: (filePath: string, mode: AppMode): Promise<string> =>
    ipcRenderer.invoke('generate-thumbnail', filePath, mode),

  // Event listeners
  onScanProgress: (callback: (progress: ScanProgress) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: ScanProgress) => callback(progress);
    ipcRenderer.on('scan-progress', listener);
    return () => ipcRenderer.removeListener('scan-progress', listener);
  },

  onScanComplete: (callback: (result: ScanResult) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, result: ScanResult) => callback(result);
    ipcRenderer.on('scan-complete', listener);
    return () => ipcRenderer.removeListener('scan-complete', listener);
  },

  onScanError: (callback: (error: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, error: string) => callback(error);
    ipcRenderer.on('scan-error', listener);
    return () => ipcRenderer.removeListener('scan-error', listener);
  }
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
