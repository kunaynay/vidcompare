import { useRef, useState, useCallback } from 'react';
import type { FileInfo } from '../types';
import { useStore } from '../store/useStore';

// Convert Windows path to file:// URL
const toFileUrl = (path: string): string => {
  const normalizedPath = path.replace(/\\/g, '/');
  return `file:///${normalizedPath}`;
};

interface ImageDiffProps {
  images: FileInfo[];
}

interface ViewportState {
  x: number; // 0-1 relative position
  y: number; // 0-1 relative position
  zoom: number;
}

export default function ImageDiff({ images }: ImageDiffProps) {
  const containerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [viewport, setViewport] = useState<ViewportState>({
    x: 0.5,
    y: 0.5,
    zoom: 1
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const { selectedForDeletion, toggleFileForDeletion } = useStore();

  // Handle mouse move for synced panning
  const handleMouseMove = useCallback((e: React.MouseEvent, index: number) => {
    if (isDragging) return;

    const container = containerRefs.current[index];
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setViewport(prev => ({
      ...prev,
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y))
    }));
  }, [isDragging]);

  // Handle wheel for zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setViewport(prev => ({
      ...prev,
      zoom: Math.max(1, Math.min(10, prev.zoom * delta))
    }));
  }, []);

  // Handle drag start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (viewport.zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [viewport.zoom]);

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle drag
  const handleDrag = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const dx = (e.clientX - dragStart.x) / 500;
    const dy = (e.clientY - dragStart.y) / 500;

    setViewport(prev => ({
      ...prev,
      x: Math.max(0, Math.min(1, prev.x - dx)),
      y: Math.max(0, Math.min(1, prev.y - dy))
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart]);

  // Reset zoom
  const resetZoom = useCallback(() => {
    setViewport({ x: 0.5, y: 0.5, zoom: 1 });
  }, []);

  // Format file size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Calculate transform based on viewport state
  const getTransformStyle = () => {
    const translateX = (0.5 - viewport.x) * (viewport.zoom - 1) * 100;
    const translateY = (0.5 - viewport.y) * (viewport.zoom - 1) * 100;
    return {
      transform: `scale(${viewport.zoom}) translate(${translateX}%, ${translateY}%)`,
      transformOrigin: `${viewport.x * 100}% ${viewport.y * 100}%`
    };
  };

  // Get grid class based on image count
  const getGridClass = () => {
    switch (images.length) {
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-3';
      case 4:
        return 'grid-cols-2 grid-rows-2';
      default:
        return 'grid-cols-3';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Image Grid */}
      <div
        className={`flex-1 grid ${getGridClass()} gap-6 overflow-hidden p-1`}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {images.map((image, index) => {
          const isSelected = selectedForDeletion.has(image.id);
          return (
            <div
              key={image.id}
              ref={el => { containerRefs.current[index] = el; }}
              className={`relative bg-surface-900 rounded-xl overflow-hidden cursor-crosshair transition-all duration-300 group
                         ${isSelected ? 'selected-glow' : 'ring-1 ring-surface-700/50 hover:ring-accent-500/30'}`}
              onMouseMove={(e) => {
                handleMouseMove(e, index);
                if (isDragging) handleDrag(e);
              }}
              onMouseDown={handleMouseDown}
              onWheel={handleWheel}
              onClick={() => !isDragging && toggleFileForDeletion(image.id)}
            >
              <div className="w-full h-full overflow-hidden">
                <img
                  src={toFileUrl(image.path)}
                  alt={image.fileName}
                  className="w-full h-full object-contain transition-transform duration-75"
                  style={getTransformStyle()}
                  draggable={false}
                />
              </div>

              {/* Selection Checkmark */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-8 h-8 bg-accent-500 rounded-lg
                                flex items-center justify-center shadow-glow z-10 animate-fade-in">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}

              {/* Crosshair indicator */}
              <div
                className="absolute w-8 h-8 pointer-events-none transition-all duration-75"
                style={{
                  left: `calc(${viewport.x * 100}% - 16px)`,
                  top: `calc(${viewport.y * 100}% - 16px)`
                }}
              >
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-accent-500/60" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-accent-500/60" />
                <div className="absolute left-1/2 top-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-500/40" />
              </div>

              {/* Image Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 media-overlay p-4">
                <div className="text-white text-sm font-medium truncate mb-1">
                  {image.fileName}
                </div>
                <div className="flex gap-3 text-xs text-surface-300 font-mono">
                  <span>{formatBytes(image.size)}</span>
                  <span className="uppercase">{image.extension.replace('.', '')}</span>
                </div>
              </div>

              {/* Index Badge */}
              <div className="absolute top-3 left-3 w-7 h-7 bg-accent-600 rounded-lg
                              flex items-center justify-center text-white text-xs font-bold shadow-glow">
                {index + 1}
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="mt-4 glass-panel rounded-xl p-5">
        <div className="flex items-center justify-center gap-4">
          {/* Zoom Controls */}
          <div className="flex items-center gap-3 bg-surface-800/50 rounded-lg p-1">
            <button
              onClick={() => setViewport(prev => ({ ...prev, zoom: Math.max(1, prev.zoom - 0.5) }))}
              className="btn-icon w-9 h-9"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </button>

            <div className="w-20 text-center">
              <span className="font-mono text-white text-sm">
                {Math.round(viewport.zoom * 100)}%
              </span>
            </div>

            <button
              onClick={() => setViewport(prev => ({ ...prev, zoom: Math.min(10, prev.zoom + 0.5) }))}
              className="btn-icon w-9 h-9"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </button>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetZoom}
            className="btn-secondary text-sm py-2"
          >
            <svg className="w-4 h-4 mr-2 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Reset View
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-4 text-center text-xs text-surface-500">
          <span className="inline-flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-accent-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            Move mouse to sync viewports. Scroll to zoom. Drag to pan when zoomed.
          </span>
        </div>
      </div>
    </div>
  );
}
