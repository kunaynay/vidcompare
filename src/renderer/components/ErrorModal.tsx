import { useStore } from '../store/useStore';

export default function ErrorModal() {
  const { error, setError } = useStore();

  if (!error) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="glass-panel rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-slide-up">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-danger-500/20 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-danger-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-semibold text-white mb-2">
              Error Occurred
            </h3>
            <p className="text-surface-300 text-sm leading-relaxed mb-5">
              {error}
            </p>
            <button
              onClick={() => setError(null)}
              className="btn-secondary text-sm"
            >
              Dismiss
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={() => setError(null)}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-700/50 hover:bg-surface-600/50 flex items-center justify-center text-surface-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
