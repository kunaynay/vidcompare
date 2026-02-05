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
    <header className="h-14 bg-surface-900 border-b border-surface-600 flex items-center px-6 drag-region">
      <div className="flex items-center gap-5 no-drag">
        {/* Logo — matches Frame Maker style */}
        <div className="flex items-center gap-3">
          <span className="text-accent-400 text-xl animate-pulse" style={{ animationDuration: '2s' }}>
            &#9724;
          </span>
          <span className="font-display text-base font-semibold text-surface-100 tracking-widest uppercase">
            VidCompare
          </span>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-surface-850 rounded-sm p-0.5 border border-surface-600">
          <button
            onClick={() => handleModeChange('image')}
            className={`px-4 py-1.5 rounded-sm text-sm font-display font-medium uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${
              mode === 'image'
                ? 'bg-accent-400 text-surface-950 shadow-glow'
                : 'text-surface-400 hover:text-surface-100 hover:bg-surface-700'
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
            className={`px-4 py-1.5 rounded-sm text-sm font-display font-medium uppercase tracking-wider transition-all duration-200 flex items-center gap-2 ${
              mode === 'video'
                ? 'bg-accent-400 text-surface-950 shadow-glow'
                : 'text-surface-400 hover:text-surface-100 hover:bg-surface-700'
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

      {/* Breadcrumb */}
      {view === 'comparison' && selectedSet && (
        <div className="flex items-center gap-3 ml-8 no-drag animate-fade-in">
          <button
            onClick={() => setView('dashboard')}
            className="flex items-center gap-2 text-surface-400 hover:text-accent-400 transition-colors group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span className="text-sm font-display uppercase tracking-wider">Dashboard</span>
          </button>
          <svg className="w-4 h-4 text-surface-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
          <span className="text-sm text-surface-100 font-display font-medium truncate max-w-xs">
            {selectedSet.normalizedName}
          </span>
        </div>
      )}

      <div className="flex-1" />

      {/* Status indicator */}
      <div className="no-drag flex items-center gap-2 text-xs text-surface-400">
        <div className="w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse" />
        <span className="font-display uppercase tracking-wider">Ready</span>
      </div>
    </header>
  );
}
