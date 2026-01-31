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
      <div className="text-center max-w-lg animate-fade-in">
        {/* Animated scanner visualization */}
        <div className="relative mb-10">
          {/* Outer ring */}
          <div className="w-40 h-40 mx-auto relative">
            {/* Background ring */}
            <div className="absolute inset-0 rounded-full border-4 border-surface-700/30" />

            {/* Progress ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r="76"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 76}`}
                strokeDashoffset={`${2 * Math.PI * 76 * (1 - progress / 100)}`}
                className="transition-all duration-500"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
              </defs>
            </svg>

            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-accent-500/5 animate-pulse" />

            {/* Inner content */}
            <div className="absolute inset-4 rounded-full bg-surface-800/50 backdrop-blur-sm border border-surface-700/30 flex items-center justify-center">
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-gradient">
                  {progress}%
                </div>
                <div className="text-xs text-surface-500 mt-1">complete</div>
              </div>
            </div>

            {/* Scanning line animation */}
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-accent-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-scan opacity-50" />
            </div>
          </div>
        </div>

        {/* Phase Text */}
        <div className="space-y-2 mb-8">
          <h2 className="font-display text-2xl font-bold text-white flex items-center justify-center gap-3">
            {getPhaseText()}
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
              <span className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <span className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </span>
          </h2>
          <p className="text-surface-400 text-sm">
            {getPhaseDescription()}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="text-center">
            <div className="font-mono text-2xl font-semibold text-white">
              {scanProgress?.current?.toLocaleString() || 0}
            </div>
            <div className="text-xs text-surface-500 mt-1">
              {scanProgress?.total ? 'processed' : 'found'}
            </div>
          </div>
          {scanProgress?.total ? (
            <>
              <div className="w-px h-8 bg-surface-700" />
              <div className="text-center">
                <div className="font-mono text-2xl font-semibold text-surface-400">
                  {scanProgress.total.toLocaleString()}
                </div>
                <div className="text-xs text-surface-500 mt-1">total</div>
              </div>
            </>
          ) : null}
        </div>

        {/* Current File */}
        {scanProgress?.currentFile && (
          <div className="glass-card rounded-lg p-3 animate-fade-in">
            <div className="flex items-center gap-2 text-xs text-surface-400">
              <svg className="w-3.5 h-3.5 flex-shrink-0 text-accent-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
              <span className="truncate font-mono">
                {scanProgress.currentFile.split(/[/\\]/).slice(-2).join('/')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
