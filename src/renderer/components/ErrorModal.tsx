import { useStore } from '../store/useStore';

export default function ErrorModal() {
  const { error, setError } = useStore();

  if (!error) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-950/92 backdrop-blur-sm"
        onClick={() => setError(null)}
      />

      {/* Modal */}
      <div className="relative bg-surface-900 border border-surface-500 rounded-lg p-6 max-w-md w-full shadow-lg animate-slide-up">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-md bg-danger-400/20 border border-danger-400/40 flex items-center justify-center">
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
            <h3 className="font-display text-lg font-semibold text-surface-100 mb-2">
              Error Occurred
            </h3>
            <p className="text-surface-300 text-sm font-body leading-relaxed mb-5">
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
            className="flex-shrink-0 btn-icon w-8 h-8"
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
