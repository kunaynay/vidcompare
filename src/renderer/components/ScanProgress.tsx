import { useStore } from '../store/useStore';

export default function ScanProgress() {
  const { scanProgress, mode } = useStore();

  const getPhaseText = () => {
    switch (scanProgress?.phase) {
      case 'scanning':
        return 'Scanning files';
      case 'hashing':
        return 'Generating fingerprints';
      case 'grouping':
        return 'Finding duplicates';
      default:
        return 'Processing';
    }
  };

  const getPhaseDescription = () => {
    switch (scanProgress?.phase) {
      case 'scanning':
        return `Looking for ${mode === 'video' ? 'video' : 'image'} files in selected folder and subfolders`;
      case 'hashing':
        return mode === 'video'
          ? 'Extracting frames and generating visual fingerprints'
          : 'Generating perceptual hashes for visual comparison';
      case 'grouping':
        return 'Comparing fingerprints to identify duplicates';
      default:
        return '';
    }
  };

  const progress = scanProgress?.total
    ? Math.round((scanProgress.current / scanProgress.total) * 100)
    : 0;

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-2xl w-full animate-fade-in">
        {/* Processing card — matches Frame Maker processing section */}
        <div className="bg-surface-900 border border-surface-600 rounded-lg p-8 mx-4">
          {/* Title */}
          <div className="mb-8 text-center">
            <h2 className="font-display text-2xl font-semibold text-surface-100 mb-2">
              {getPhaseText()}
            </h2>
            <p className="text-surface-200 font-body text-sm">
              {getPhaseDescription()}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="h-1 bg-surface-850 rounded-sm overflow-hidden mb-3">
              <div
                className="h-full rounded-sm transition-all duration-300 ease-out"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #cc8f39, #ffb347)',
                  boxShadow: '0 0 12px rgba(255, 179, 71, 0.15)',
                }}
              />
            </div>
            <div className="flex justify-between font-display text-sm">
              <span className="text-accent-400 font-semibold">{progress}%</span>
              <span className="text-surface-300">
                {scanProgress?.total
                  ? `${scanProgress.current.toLocaleString()} of ${scanProgress.total.toLocaleString()}`
                  : `${scanProgress?.current?.toLocaleString() || 0} found`}
              </span>
            </div>
          </div>

          {/* Stage Indicators */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { key: 'scanning', label: 'Scanning Files' },
              { key: 'hashing', label: 'Analyzing Similarity' },
              { key: 'grouping', label: 'Grouping Duplicates' },
            ].map((stage) => {
              const isActive = scanProgress?.phase === stage.key;
              const isComplete =
                (stage.key === 'scanning' && (scanProgress?.phase === 'hashing' || scanProgress?.phase === 'grouping')) ||
                (stage.key === 'hashing' && scanProgress?.phase === 'grouping');

              return (
                <div
                  key={stage.key}
                  className={`flex items-center gap-3 p-3 bg-surface-850 rounded-sm border transition-all duration-250 font-display text-sm
                    ${isActive ? 'border-accent-600 text-surface-100' : isComplete ? 'border-surface-500 text-surface-100' : 'border-surface-600 text-surface-200'}`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-all duration-250
                    ${isActive ? 'bg-accent-400 shadow-glow animate-ping-stage' : isComplete ? 'bg-success-400' : 'bg-surface-500'}`}
                  />
                  <span>{stage.label}</span>
                </div>
              );
            })}
          </div>

          {/* Current File */}
          {scanProgress?.currentFile && (
            <div className="p-3 bg-surface-850 rounded-sm border border-surface-600 animate-fade-in">
              <div className="flex items-center gap-2 text-xs text-surface-300 font-display">
                <svg className="w-3.5 h-3.5 flex-shrink-0 text-accent-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
                <span className="truncate">
                  {scanProgress.currentFile.split(/[/\\]/).slice(-2).join('/')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
