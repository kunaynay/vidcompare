import { useStore } from '../store/useStore';
import SyncPlayer from './SyncPlayer';
import ImageDiff from './ImageDiff';
import FileList from './FileList';

export default function ComparisonView() {
  const { selectedSet, mode, setView } = useStore();

  if (!selectedSet) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-surface-800/50 border border-surface-700/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-surface-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
          <p className="text-surface-400 mb-4">No set selected</p>
          <button
            onClick={() => setView('dashboard')}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-fade-in">
      {/* Comparison Area */}
      <div className="flex-1 overflow-hidden p-4">
        {mode === 'video' ? (
          <SyncPlayer videos={selectedSet.files} />
        ) : (
          <ImageDiff images={selectedSet.files} />
        )}
      </div>

      {/* File List */}
      <div className="h-72 border-t border-surface-700/50 overflow-auto bg-surface-900/30">
        <FileList files={selectedSet.files} />
      </div>
    </div>
  );
}
