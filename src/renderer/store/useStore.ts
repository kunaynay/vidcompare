import { create } from 'zustand';
import type { AppMode, DuplicateSet, ScanProgress, ScanResult, FileInfo } from '../types';

interface AppState {
  // Mode
  mode: AppMode;
  setMode: (mode: AppMode) => void;

  // Folder selection
  selectedFolder: string | null;
  setSelectedFolder: (folder: string | null) => void;

  // Scanning state
  isScanning: boolean;
  scanProgress: ScanProgress | null;
  setIsScanning: (isScanning: boolean) => void;
  setScanProgress: (progress: ScanProgress | null) => void;

  // Results
  scanResult: ScanResult | null;
  setScanResult: (result: ScanResult | null) => void;

  // Selection for deletion
  selectedForDeletion: Set<string>;
  toggleFileForDeletion: (fileId: string) => void;
  selectAllInSet: (setId: string) => void;
  deselectAllInSet: (setId: string) => void;
  clearSelection: () => void;

  // Comparison view
  selectedSet: DuplicateSet | null;
  setSelectedSet: (set: DuplicateSet | null) => void;

  // UI State
  view: 'dashboard' | 'comparison';
  setView: (view: 'dashboard' | 'comparison') => void;

  // Error handling
  error: string | null;
  setError: (error: string | null) => void;

  // Actions
  reset: () => void;
  removeFilesFromResults: (fileIds: string[]) => void;
}

const initialState = {
  mode: 'video' as AppMode,
  selectedFolder: null,
  isScanning: false,
  scanProgress: null,
  scanResult: null,
  selectedForDeletion: new Set<string>(),
  selectedSet: null,
  view: 'dashboard' as const,
  error: null,
};

export const useStore = create<AppState>((set, get) => ({
  ...initialState,

  setMode: (mode) => set({ mode }),

  setSelectedFolder: (folder) => set({ selectedFolder: folder }),

  setIsScanning: (isScanning) => set({ isScanning }),

  setScanProgress: (progress) => set({ scanProgress: progress }),

  setScanResult: (result) => set({ scanResult: result }),

  toggleFileForDeletion: (fileId) => {
    const current = get().selectedForDeletion;
    const newSet = new Set(current);
    if (newSet.has(fileId)) {
      newSet.delete(fileId);
    } else {
      newSet.add(fileId);
    }
    set({ selectedForDeletion: newSet });
  },

  selectAllInSet: (setId) => {
    const result = get().scanResult;
    if (!result) return;

    const duplicateSet = result.duplicateSets.find(s => s.id === setId);
    if (!duplicateSet) return;

    const current = get().selectedForDeletion;
    const newSet = new Set(current);
    duplicateSet.files.forEach(file => newSet.add(file.id));
    set({ selectedForDeletion: newSet });
  },

  deselectAllInSet: (setId) => {
    const result = get().scanResult;
    if (!result) return;

    const duplicateSet = result.duplicateSets.find(s => s.id === setId);
    if (!duplicateSet) return;

    const current = get().selectedForDeletion;
    const newSet = new Set(current);
    duplicateSet.files.forEach(file => newSet.delete(file.id));
    set({ selectedForDeletion: newSet });
  },

  clearSelection: () => set({ selectedForDeletion: new Set() }),

  setSelectedSet: (selectedSet) => set({ selectedSet }),

  setView: (view) => set({ view }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),

  removeFilesFromResults: (fileIds) => {
    const result = get().scanResult;
    const currentSelectedSet = get().selectedSet;
    if (!result) return;

    const fileIdSet = new Set(fileIds);
    const updatedSets = result.duplicateSets
      .map(dupSet => ({
        ...dupSet,
        files: dupSet.files.filter(f => !fileIdSet.has(f.id))
      }))
      .filter(dupSet => dupSet.files.length >= 2); // Remove sets with less than 2 files

    const totalDuplicates = updatedSets.reduce(
      (sum, dupSet) => sum + dupSet.files.length - 1,
      0
    );

    // Recalculate space savings
    let spaceSavings = 0;
    for (const dupSet of updatedSets) {
      const sortedBySize = [...dupSet.files].sort((a, b) => b.size - a.size);
      for (let i = 1; i < sortedBySize.length; i++) {
        spaceSavings += sortedBySize[i].size;
      }
    }

    // Check if current selected set still exists
    let newSelectedSet = currentSelectedSet;
    if (currentSelectedSet) {
      const stillExists = updatedSets.find(s => s.id === currentSelectedSet.id);
      if (!stillExists) {
        newSelectedSet = null;
      } else {
        // Update the selected set with remaining files
        newSelectedSet = stillExists;
      }
    }

    set({
      scanResult: {
        ...result,
        duplicateSets: updatedSets,
        totalDuplicatesFound: totalDuplicates,
        spaceSavings
      },
      selectedForDeletion: new Set(),
      selectedSet: newSelectedSet,
      view: newSelectedSet ? get().view : 'dashboard'
    });
  }
}));
