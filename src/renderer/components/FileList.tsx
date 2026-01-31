import { useStore } from '../store/useStore';
import type { FileInfo } from '../types';

interface FileListProps {
  files: FileInfo[];
}

export default function FileList({ files }: FileListProps) {
  const { selectedForDeletion, toggleFileForDeletion, mode } = useStore();

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Find the "best" file (largest for images, highest resolution/duration for videos)
  const getBestFileIndex = (): number => {
    if (mode === 'video') {
      // Prefer highest resolution, then longest duration
      return files.reduce((bestIdx, file, idx) => {
        const best = files[bestIdx];
        const currentPixels = (file.width || 0) * (file.height || 0);
        const bestPixels = (best.width || 0) * (best.height || 0);
        if (currentPixels > bestPixels) return idx;
        if (currentPixels === bestPixels && (file.duration || 0) > (best.duration || 0)) return idx;
        return bestIdx;
      }, 0);
    } else {
      // For images, prefer largest file size
      return files.reduce((bestIdx, file, idx) =>
        file.size > files[bestIdx].size ? idx : bestIdx
      , 0);
    }
  };

  const bestIndex = getBestFileIndex();

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-accent-500 rounded-full" />
          <h3 className="font-semibold text-white">Files in this set</h3>
          <span className="text-xs text-surface-500 ml-2">({files.length} files)</span>
        </div>
        <span className="text-xs text-surface-500">
          Click to select for deletion
        </span>
      </div>

      {/* File list */}
      <div className="space-y-2">
        {files.map((file, index) => {
          const isSelected = selectedForDeletion.has(file.id);
          const isBest = index === bestIndex;

          return (
            <div
              key={file.id}
              onClick={() => toggleFileForDeletion(file.id)}
              className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-200
                         ${isSelected
                           ? 'bg-danger-500/10 border border-danger-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                           : isBest
                             ? 'bg-success-500/5 border border-success-500/20 hover:border-success-500/30 hover:bg-success-500/10 shadow-[0_0_10px_rgba(34,197,94,0.05)]'
                             : 'glass-card hover:border-surface-600/50 hover:bg-surface-700/30'
                         }`}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => {}}
                className="flex-shrink-0"
              />

              {/* Index Badge */}
              <div className={`w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center
                              text-xs font-bold transition-colors relative
                              ${isBest
                                ? 'bg-success-500/20 text-success-300 border border-success-500/40 shadow-[0_0_8px_rgba(34,197,94,0.15)]'
                                : 'bg-surface-700/50 text-surface-400 border border-surface-600/30'
                              }`}>
                {isBest ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-medium truncate">{file.fileName}</span>
                  {isBest && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-success-500/20 text-success-300 border border-success-500/40 rounded-full text-xs font-semibold flex-shrink-0 shadow-[0_0_8px_rgba(34,197,94,0.15)]">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      Best Quality
                    </span>
                  )}
                </div>
                <div className="text-xs text-surface-500 truncate font-mono">
                  {file.path}
                </div>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-3 text-sm flex-shrink-0">
                <div className="text-right">
                  <div className="font-mono text-surface-200">{formatBytes(file.size)}</div>
                  <div className="text-xs text-surface-500">size</div>
                </div>
                {mode === 'video' && (
                  <>
                    <div className="w-px h-8 bg-surface-700/50" />
                    <div className="text-right min-w-[80px]">
                      <div className="font-mono text-surface-200">
                        {file.width && file.height ? `${file.width}x${file.height}` : '-'}
                      </div>
                      <div className="text-xs text-surface-500">resolution</div>
                    </div>
                    <div className="w-px h-8 bg-surface-700/50" />
                    <div className="text-right min-w-[50px]">
                      <div className="font-mono text-surface-200">{formatDuration(file.duration)}</div>
                      <div className="text-xs text-surface-500">duration</div>
                    </div>
                  </>
                )}
                <div className="w-px h-8 bg-surface-700/50" />
                <div className="text-right min-w-[50px]">
                  <div className="font-mono text-surface-400 uppercase text-xs">
                    {file.extension.replace('.', '')}
                  </div>
                  <div className="text-xs text-surface-500">format</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Warning if all files selected */}
      {files.every(f => selectedForDeletion.has(f.id)) && (
        <div className="mt-4 p-4 bg-danger-500/10 border border-danger-500/30 rounded-xl animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-danger-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-danger-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-danger-400">Warning</div>
              <div className="text-sm text-surface-400">
                All copies are selected for deletion! This will permanently remove all versions of this file.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
