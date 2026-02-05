import { useStore } from '../store/useStore';

export default function Sidebar() {
  const {
    mode,
    selectedFolder,
    setSelectedFolder,
    scanResult,
    setScanResult,
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
      if (selectedSet) {
        const remainingInCurrentSet = selectedSet.files.filter(
          f => !selectedForDeletion.has(f.id)
        );
        if (remainingInCurrentSet.length < 2) {
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
    <aside className="w-72 bg-surface-900 border-r border-surface-600 flex flex-col">
      {/* Folder Selection */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-accent-400 rounded-full" />
          <h3 className="text-xs font-display font-semibold text-surface-300 uppercase tracking-widest">Scan Location</h3>
        </div>

        {selectedFolder ? (
          <div className="w-full p-4 bg-surface-850 border border-accent-600/40 border-l-2 border-l-accent-400 rounded-md
                          transition-all duration-200">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-xs text-accent-400 font-display uppercase tracking-wider">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                Selected folder
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFolder(null);
                  setScanResult(null);
                  setScanProgress(null);
                  clearSelection();
                  setSelectedSet(null);
                  setView('dashboard');
                }}
                disabled={isScanning}
                className="w-6 h-6 flex items-center justify-center rounded-sm text-surface-400
                           hover:text-danger-400 hover:bg-danger-400/10 transition-all duration-150
                           disabled:opacity-50 disabled:cursor-not-allowed"
                title="Clear folder selection"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="text-surface-100 font-medium truncate text-sm">
              {selectedFolder.split(/[/\\]/).pop()}
            </div>
            <div className="text-xs text-surface-400 truncate font-display mt-0.5">
              {selectedFolder}
            </div>
          </div>
        ) : (
          <button
            onClick={handleSelectFolder}
            disabled={isScanning}
            className="w-full p-4 bg-surface-850 border border-surface-600 rounded-md text-left transition-all duration-200
                       hover:border-accent-600 hover:bg-surface-800
                       disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="flex items-center gap-3 text-surface-400 group-hover:text-accent-400 transition-colors">
              <div className="w-10 h-10 rounded-md bg-surface-800 border border-surface-600 flex items-center justify-center group-hover:border-accent-600 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  <path d="M12 11v6M9 14h6" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium font-display text-surface-100">Select Folder</div>
                <div className="text-xs text-surface-400 font-body">Click to browse</div>
              </div>
            </div>
          </button>
        )}

        {/* Scan Button */}
        <div className="mt-4">
          {isScanning ? (
            <button
              onClick={handleCancelScan}
              className="w-full btn-danger flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
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
              <div className="w-1 h-4 bg-accent-400 rounded-full" />
              <h3 className="text-xs font-display font-semibold text-surface-300 uppercase tracking-widest">Results</h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-surface-300 font-body">Files Scanned</span>
                <span className="stat-value text-surface-100">{scanResult.totalFilesScanned.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-surface-300 font-body">Duplicate Sets</span>
                <span className="stat-value text-surface-100">{scanResult.duplicateSets.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-surface-300 font-body">Duplicates Found</span>
                <span className="stat-value text-accent-400">{scanResult.totalDuplicatesFound}</span>
              </div>

              {/* Savings highlight */}
              <div className="mt-4 p-3 rounded-md bg-success-400/10 border border-success-400/20">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-success-400 font-display uppercase tracking-wider">Potential Savings</span>
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
              <div className="w-1 h-4 bg-danger-400 rounded-full" />
              <h3 className="text-xs font-display font-semibold text-surface-300 uppercase tracking-widest">Selection</h3>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-danger-400/20 border border-danger-400/40 flex items-center justify-center">
                  <svg className="w-4 h-4 text-danger-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-surface-100 font-display">{selectedForDeletion.size} files</div>
                  <div className="text-xs text-surface-400 font-body">selected for deletion</div>
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

      <div className="flex-1" />

      {/* Help */}
      <div className="p-5 border-t border-surface-600">
        <div className="flex items-start gap-3 text-xs text-surface-400 font-body">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-surface-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
