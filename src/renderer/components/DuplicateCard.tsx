import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import type { DuplicateSet } from '../types';

// Convert Windows path to file:// URL
const toFileUrl = (path: string): string => {
  const normalizedPath = path.replace(/\\/g, '/');
  return `file:///${normalizedPath}`;
};

interface DuplicateCardProps {
  duplicateSet: DuplicateSet;
}

export default function DuplicateCard({ duplicateSet }: DuplicateCardProps) {
  const { mode, setSelectedSet, setView, selectedForDeletion } = useStore();
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadThumbnail() {
      if (duplicateSet.files.length > 0) {
        try {
          const thumbPath = await window.electronAPI.generateThumbnail(
            duplicateSet.files[0].path,
            mode
          );
          if (mounted && thumbPath) {
            setThumbnail(toFileUrl(thumbPath));
          }
        } catch (err) {
          console.error('Failed to load thumbnail:', err);
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
        }
      }
    }

    loadThumbnail();

    return () => {
      mounted = false;
    };
  }, [duplicateSet, mode]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClick = () => {
    setSelectedSet(duplicateSet);
    setView('comparison');
  };

  const selectedCount = duplicateSet.files.filter(f => selectedForDeletion.has(f.id)).length;
  const totalSize = duplicateSet.files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div
      onClick={handleClick}
      className="glass-card rounded-xl overflow-hidden cursor-pointer card-hover group"
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-surface-900 relative overflow-hidden">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-surface-600 border-t-accent-500 rounded-full animate-spin" />
          </div>
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt={duplicateSet.normalizedName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-800/50">
            {mode === 'video' ? (
              <svg className="w-12 h-12 text-surface-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M10 9l5 3-5 3V9z" fill="currentColor" />
              </svg>
            ) : (
              <svg className="w-12 h-12 text-surface-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            )}
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* File count badge */}
        <div className="absolute top-3 right-3 badge badge-warning">
          <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
          </svg>
          {duplicateSet.files.length}
        </div>

        {/* Match type badge */}
        <div className={`absolute top-3 left-3 badge ${
          duplicateSet.matchType === 'visual'
            ? 'badge-accent'
            : 'badge-neutral'
        }`}>
          {duplicateSet.matchType === 'visual' ? (
            <>
              <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Visual
            </>
          ) : (
            <>
              <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              </svg>
              Name
            </>
          )}
        </div>

        {/* Duration (for videos) */}
        {mode === 'video' && duplicateSet.files[0]?.duration && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-mono rounded">
            {formatDuration(duplicateSet.files[0].duration)}
          </div>
        )}

        {/* Selected indicator */}
        {selectedCount > 0 && (
          <div className="absolute bottom-3 left-3 badge badge-danger">
            <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            {selectedCount}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-medium text-white truncate mb-2 group-hover:text-accent-300 transition-colors" title={duplicateSet.normalizedName}>
          {duplicateSet.normalizedName || 'Unnamed'}
        </h3>
        <div className="flex items-center justify-between text-sm">
          <span className="text-surface-400 font-mono">{formatBytes(totalSize)}</span>
          <span className="text-surface-500 text-xs">total size</span>
        </div>
      </div>
    </div>
  );
}
