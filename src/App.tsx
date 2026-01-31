import { useState, useEffect } from 'react';
import FlowChart from './components/FlowChart';
import Toolbar from './components/Toolbar';
import SidePanel from './components/panels/SidePanel';
import SettingsPanel from './components/panels/SettingsPanel';
import QuickstartWizard from './components/QuickstartWizard';
import Toast from './components/Toast';
import { useStore } from './store/useStore';
import Onboarding from './components/Onboarding';
import styles from './App.module.css';

function App() {
  const nodes = useStore((state) => state.nodes);
  const [showQuickstart, setShowQuickstart] = useState(false);
  const [hasCheckedInitial, setHasCheckedInitial] = useState(false);

  // Show quickstart wizard on first launch if there are no nodes
  useEffect(() => {
    if (!hasCheckedInitial) {
      setHasCheckedInitial(true);
      // Small delay to let the store hydrate from localStorage
      const timer = setTimeout(() => {
        if (nodes.length === 0) {
          setShowQuickstart(true);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [hasCheckedInitial, nodes.length]);

  const handleOpenQuickstart = () => {
    setShowQuickstart(true);
  };

  const handleCloseQuickstart = () => {
    setShowQuickstart(false);
  };

  return (
    <div className={styles.app}>
      <Toolbar />
      <main className={styles.main}>
        <FlowChart />
      </main>
      <SidePanel />
      <SettingsPanel onOpenQuickstart={handleOpenQuickstart} />
      <Toast />
      {showQuickstart && <QuickstartWizard onClose={handleCloseQuickstart} />}
      <Onboarding />
    </div>
  );
}

export default App;
