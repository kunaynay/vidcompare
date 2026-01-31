import { useStore } from '../store/useStore';
import type { AppMode } from '../types';

export default function Header() {
  const { mode, setMode, view, setView, selectedSet } = useStore();

  const handleModeChange = (newMode: AppMode) => {
    if (mode !== newMode) {
      setMode(newMode);
    }
  };

  return (
    <header className="h-14 glass-panel border-t-0 border-x-0 flex items-center px-5 drag-region relative">
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-500/30 to-transparent" />

      <div className="flex items-center gap-5 no-drag">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-glow">
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M15 10l-4 4l6 6l4-16l-18 7l6 2l2 6l4-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div>
            <span className="font-display text-lg font-bold text-white tracking-tight">
              VidCompare
            </span>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-surface-800/80 rounded-lg p-1 border border-surface-700/50">
          <button
            onClick={() => handleModeChange('image')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              mode === 'image'
                ? 'bg-accent-600 text-white shadow-glow'
                : 'text-surface-400 hover:text-white hover:bg-surface-700/50'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            Images
          </button>
          <button
            onClick={() => handleModeChange('video')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              mode === 'video'
                ? 'bg-accent-600 text-white shadow-glow'
                : 'text-surface-400 hover:text-white hover:bg-surface-700/50'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M10 9l5 3-5 3V9z" fill="currentColor" />
            </svg>
            Videos
          </button>
        </div>
      </div>

      {/* Breadcrumb / Navigation */}
      {view === 'comparison' && selectedSet && (
        <div className="flex items-center gap-3 ml-8 no-drag animate-fade-in">
          <button
            onClick={() => setView('dashboard')}
            className="flex items-center gap-2 text-surface-400 hover:text-accent-400 transition-colors group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="text-sm">Dashboard</span>
          </button>
          <svg className="w-4 h-4 text-surface-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
          <span className="text-sm text-white font-medium truncate max-w-xs">
            {selectedSet.normalizedName}
          </span>
        </div>
      )}

      {/* Spacer for dragging */}
      <div className="flex-1" />

      {/* Subtle status indicator */}
      <div className="no-drag flex items-center gap-2 text-xs text-surface-500">
        <div className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
        <span className="font-mono">Ready</span>
      </div>
    </header>
  );
}
