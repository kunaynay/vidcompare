import { useStore } from '../store/useStore';

export default function Sidebar() {
  const {
    mode,
    selectedFolder,
    setSelectedFolder,
    scanResult,
    isScanning,
    setIsScanning,
    setScanProgress,
    selectedForDeletion,
    clearSelection,
    removeFilesFromResults,
    selectedSet,
    setSelectedSet,
    setView
  } = useStore();

  const handleSelectFolder = async () => {
    const folder = await window.electronAPI.selectFolder();
    if (folder) {
      setSelectedFolder(folder);
    }
  };

  const handleStartScan = async () => {
    if (!selectedFolder) return;
    setIsScanning(true);
    setScanProgress({ phase: 'scanning', current: 0, total: 0 });
    await window.electronAPI.startScan(selectedFolder, mode);
  };

  const handleCancelScan = async () => {
    await window.electronAPI.cancelScan();
    setIsScanning(false);
    setScanProgress(null);
  };

  const handleDeleteSelected = async () => {
    if (selectedForDeletion.size === 0) return;

    // Get all files that are selected
    const filesToDelete: string[] = [];
    const fileIds: string[] = [];

    if (scanResult) {
      for (const set of scanResult.duplicateSets) {
        for (const file of set.files) {
          if (selectedForDeletion.has(file.id)) {
            filesToDelete.push(file.path);
            fileIds.push(file.id);
          }
        }
      }
    }

    // Check if deleting all files in any set
    const setsBeingEmptied: string[] = [];
    if (scanResult) {
      for (const set of scanResult.duplicateSets) {
        const remainingFiles = set.files.filter(f => !selectedForDeletion.has(f.id));
        if (remainingFiles.length === 0) {
          setsBeingEmptied.push(set.normalizedName);
        }
      }
    }

    if (setsBeingEmptied.length > 0) {
      const confirmed = confirm(
        `Warning: You are about to delete ALL copies of the following files:\n\n${setsBeingEmptied.join('\n')}\n\nAre you sure?`
      );
      if (!confirmed) return;
    }

    const result = await window.electronAPI.deleteFiles(filesToDelete);

    if (result.success) {
      // Check if current selected set will have less than 2 files after deletion
      if (selectedSet) {
        const remainingInCurrentSet = selectedSet.files.filter(
          f => !selectedForDeletion.has(f.id)
        );
        if (remainingInCurrentSet.length < 2) {
          // Navigate back to dashboard since this set is no longer a duplicate
          setSelectedSet(null);
          setView('dashboard');
        }
      }
      removeFilesFromResults(fileIds);
    } else {
      alert(`Some files could not be deleted:\n${result.errors.join('\n')}`);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <aside className="w-72 glass-panel border-t-0 border-b-0 border-l-0 flex flex-col">
      {/* Folder Selection */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-accent-500 rounded-full" />
          <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Scan Location</h3>
        </div>

        <button
          onClick={handleSelectFolder}
          disabled={isScanning}
          className="w-full p-4 glass-card rounded-xl text-left transition-all duration-200
                     hover:border-accent-500/30 hover:bg-surface-700/30
                     disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {selectedFolder ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-surface-400">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                Selected folder
              </div>
              <div className="text-white font-medium truncate text-sm">
                {selectedFolder.split(/[/\\]/).pop()}
              </div>
              <div className="text-xs text-surface-500 truncate font-mono">
                {selectedFolder}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-surface-400 group-hover:text-accent-400 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-surface-700/50 flex items-center justify-center group-hover:bg-accent-500/10 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  <path d="M12 11v6M9 14h6" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium">Select Folder</div>
                <div className="text-xs text-surface-500">Click to browse</div>
              </div>
            </div>
          )}
        </button>

        {/* Scan Button */}
        <div className="mt-4">
          {isScanning ? (
            <button
              onClick={handleCancelScan}
              className="w-full btn-danger flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
              Cancel Scan
            </button>
          ) : (
            <button
              onClick={handleStartScan}
              disabled={!selectedFolder}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              Start Scan
            </button>
          )}
        </div>
      </div>

      <div className="divider" />

      {/* Stats */}
      {scanResult && (
        <>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-accent-500 rounded-full" />
              <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Results</h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-surface-400">Files Scanned</span>
                <span className="stat-value text-white">{scanResult.totalFilesScanned.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-surface-400">Duplicate Sets</span>
                <span className="stat-value text-white">{scanResult.duplicateSets.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-surface-400">Duplicates Found</span>
                <span className="stat-value text-warning-400">{scanResult.totalDuplicatesFound}</span>
              </div>

              {/* Savings highlight */}
              <div className="mt-4 p-3 rounded-lg bg-success-500/10 border border-success-500/20">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-success-400">Potential Savings</span>
                  <span className="stat-value text-success-400 text-base">{formatBytes(scanResult.spaceSavings)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="divider" />
        </>
      )}

      {/* Selection Actions */}
      {selectedForDeletion.size > 0 && (
        <>
          <div className="p-5 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-danger-500 rounded-full" />
              <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Selection</h3>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-danger-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-danger-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{selectedForDeletion.size} files</div>
                  <div className="text-xs text-surface-500">selected for deletion</div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={clearSelection}
                className="flex-1 btn-secondary text-sm py-2"
              >
                Clear
              </button>
              <button
                onClick={handleDeleteSelected}
                className="flex-1 btn-danger text-sm py-2"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="divider" />
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Help */}
      <div className="p-5 border-t border-surface-700/30">
        <div className="flex items-start gap-3 text-xs text-surface-500">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-surface-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <p className="leading-relaxed">
            Files will be moved to Trash, not permanently deleted.
          </p>
        </div>
      </div>
    </aside>
  );
}
