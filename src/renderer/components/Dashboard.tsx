import { useStore } from '../store/useStore';
import DuplicateCard from './DuplicateCard';

export default function Dashboard() {
  const { scanResult, mode } = useStore();

  if (!scanResult) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md animate-fade-in">
          {/* Upload-style empty state */}
          <div className="relative mb-8">
            <div className="relative w-24 h-24 mx-auto rounded-md bg-surface-900 border border-surface-600 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-surface-400 animate-float"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                <path d="M12 11v4M10 13h4" />
              </svg>
            </div>
          </div>

          <h2 className="font-display text-2xl font-semibold text-surface-100 mb-3">
            No scan results yet
          </h2>
          <p className="text-surface-300 font-body leading-relaxed">
            Select a folder and start scanning to find duplicate {mode === 'video' ? 'videos' : 'images'} in your collection.
          </p>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-surface-400 font-display uppercase tracking-wider">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span>Use the sidebar to get started</span>
          </div>
        </div>
      </div>
    );
  }

  if (scanResult.duplicateSets.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md animate-fade-in">
          <div className="relative mb-8">
            <div className="relative w-24 h-24 mx-auto rounded-md bg-success-400/10 border border-success-400/20 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-success-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
          </div>

          <h2 className="font-display text-2xl font-semibold text-surface-100 mb-3">
            No duplicates found!
          </h2>
          <p className="text-surface-300 font-body leading-relaxed">
            Scanned <span className="text-surface-100 font-display">{scanResult.totalFilesScanned.toLocaleString()}</span> files.
            Your {mode === 'video' ? 'video' : 'image'} collection looks clean!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-baseline gap-3 mb-2">
          <h2 className="font-display text-3xl font-semibold text-surface-100">
            {scanResult.duplicateSets.length}
          </h2>
          <span className="text-xl text-surface-300 font-body">
            Duplicate Set{scanResult.duplicateSets.length !== 1 ? 's' : ''} Found
          </span>
        </div>
        <p className="text-surface-400 font-body">
          Click on a set to compare files and select which ones to delete
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {scanResult.duplicateSets.map((set, index) => (
          <div
            key={set.id}
            className="animate-fade-in-scale"
            style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
          >
            <DuplicateCard duplicateSet={set} />
          </div>
        ))}
      </div>
    </div>
  );
}
