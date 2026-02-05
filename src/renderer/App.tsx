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
    <div className="h-screen flex flex-col bg-surface-950">
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
      <ErrorModal />
    </div>
  );
}
