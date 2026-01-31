import { useEffect } from 'react';
import { useStore } from './store/useStore';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ComparisonView from './components/ComparisonView';
import ScanProgress from './components/ScanProgress';
import ErrorModal from './components/ErrorModal';

export default function App() {
  const {
    view,
    isScanning,
    setScanProgress,
    setScanResult,
    setIsScanning,
    setError
  } = useStore();

  useEffect(() => {
    // Set up IPC listeners
    const unsubProgress = window.electronAPI.onScanProgress((progress) => {
      setScanProgress(progress);
    });

    const unsubComplete = window.electronAPI.onScanComplete((result) => {
      setScanResult(result);
      setIsScanning(false);
      setScanProgress(null);
    });

    const unsubError = window.electronAPI.onScanError((error) => {
      setError(error);
      setIsScanning(false);
      setScanProgress(null);
    });

    return () => {
      unsubProgress();
      unsubComplete();
      unsubError();
    };
  }, [setScanProgress, setScanResult, setIsScanning, setError]);

  return (
    <div className="h-screen flex flex-col bg-surface-950 relative">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/2 -left-1/4 w-full h-full bg-gradient-radial from-accent-500/5 via-transparent to-transparent" />
        <div className="absolute -bottom-1/2 -right-1/4 w-full h-full bg-gradient-radial from-accent-600/3 via-transparent to-transparent" />
      </div>

      {/* Main layout */}
      <div className="relative z-10 h-full flex flex-col">
        <Header />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            {isScanning ? (
              <ScanProgress />
            ) : view === 'dashboard' ? (
              <Dashboard />
            ) : (
              <ComparisonView />
            )}
          </main>
        </div>
      </div>

      <ErrorModal />
    </div>
  );
}
