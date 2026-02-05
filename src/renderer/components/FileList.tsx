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

  const getBestFileIndex = (): number => {
    if (mode === 'video') {
      return files.reduce((bestIdx, file, idx) => {
        const best = files[bestIdx];
        const currentPixels = (file.width || 0) * (file.height || 0);
        const bestPixels = (best.width || 0) * (best.height || 0);
        if (currentPixels > bestPixels) return idx;
        if (currentPixels === bestPixels && (file.duration || 0) > (best.duration || 0)) return idx;
        return bestIdx;
      }, 0);
    } else {
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
          <div className="w-1 h-4 bg-accent-400 rounded-full" />
          <h3 className="font-display font-semibold text-surface-100 text-sm uppercase tracking-wider">Files in this set</h3>
          <span className="text-xs text-surface-400 font-display ml-2">({files.length} files)</span>
        </div>
        <span className="text-xs text-surface-400 font-display uppercase tracking-wider">
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
              className={`flex items-center gap-4 p-3 rounded-md cursor-pointer transition-all duration-200
                         ${isSelected
                           ? 'bg-danger-400/10 border border-danger-400/30'
                           : isBest
                             ? 'bg-success-400/5 border border-success-400/20 hover:border-success-400/30 hover:bg-success-400/10'
                             : 'bg-surface-850 border border-surface-600 hover:border-accent-600 hover:bg-surface-800'
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
              <div className={`w-7 h-7 flex-shrink-0 rounded-sm flex items-center justify-center
                              text-xs font-bold font-display transition-colors relative
                              ${isBest
                                ? 'bg-success-400/20 text-success-400 border border-success-400/40'
                                : 'bg-surface-800 text-surface-400 border border-surface-600'
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
                  <span className="text-surface-100 font-medium truncate font-body">{file.fileName}</span>
                  {isBest && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-success-400/20 text-success-400 border border-success-400/40 rounded-sm text-xs font-display font-semibold uppercase tracking-wider flex-shrink-0">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      Best
                    </span>
                  )}
                </div>
                <div className="text-xs text-surface-400 truncate font-display">
                  {file.path}
                </div>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-3 text-sm flex-shrink-0">
                <div className="text-right">
                  <div className="font-display text-surface-200">{formatBytes(file.size)}</div>
                  <div className="text-xs text-surface-400 font-display uppercase tracking-wider">size</div>
                </div>
                {mode === 'video' && (
                  <>
                    <div className="w-px h-8 bg-surface-600" />
                    <div className="text-right min-w-[80px]">
                      <div className="font-display text-surface-200">
                        {file.width && file.height ? `${file.width}x${file.height}` : '-'}
                      </div>
                      <div className="text-xs text-surface-400 font-display uppercase tracking-wider">resolution</div>
                    </div>
                    <div className="w-px h-8 bg-surface-600" />
                    <div className="text-right min-w-[50px]">
                      <div className="font-display text-surface-200">{formatDuration(file.duration)}</div>
                      <div className="text-xs text-surface-400 font-display uppercase tracking-wider">duration</div>
                    </div>
                  </>
                )}
                <div className="w-px h-8 bg-surface-600" />
                <div className="text-right min-w-[50px]">
                  <div className="font-display text-surface-400 uppercase text-xs">
                    {file.extension.replace('.', '')}
                  </div>
                  <div className="text-xs text-surface-400 font-display uppercase tracking-wider">format</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Warning if all files selected */}
      {files.every(f => selectedForDeletion.has(f.id)) && (
        <div className="mt-4 p-4 bg-danger-400/10 border border-danger-400/30 rounded-md animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-danger-400/20 border border-danger-400/40 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-danger-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <div className="font-display font-semibold text-danger-400 uppercase tracking-wider text-sm">Warning</div>
              <div className="text-sm text-surface-300 font-body">
                All copies are selected for deletion! This will permanently remove all versions of this file.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
