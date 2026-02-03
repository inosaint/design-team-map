import { useState, useEffect, useRef } from 'react';
import FlowChart from './components/FlowChart';
import Toolbar from './components/Toolbar';
import SidePanel from './components/panels/SidePanel';
import SettingsPanel from './components/panels/SettingsPanel';
import QuickstartWizard from './components/QuickstartWizard';
import Toast from './components/Toast';
import { useStore } from './store/useStore';
import Onboarding from './components/Onboarding';
import styles from './App.module.css';
import { ONBOARDING_MODE_KEY, QUICKSTART_SEEN_KEY } from './constants/onboarding';

function App() {
  const [showQuickstart, setShowQuickstart] = useState(false);
  const hasCheckedInitialRef = useRef(false);
  const [onboardingMode, setOnboardingMode] = useState<'regular' | 'post-quickstart' | undefined>(undefined);

  // Show quickstart wizard on first launch if there are no nodes and user hasn't seen it
  useEffect(() => {
    if (hasCheckedInitialRef.current) return;
    hasCheckedInitialRef.current = true;

    // Small delay to let the store hydrate from localStorage
    const timer = setTimeout(() => {
      const hasSeenQuickstart = localStorage.getItem(QUICKSTART_SEEN_KEY) === 'true';
      const currentNodes = useStore.getState().nodes;
      if (currentNodes.length === 0 && !hasSeenQuickstart) {
        setShowQuickstart(true);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenQuickstart = () => {
    setShowQuickstart(true);
  };

  const handleCloseQuickstart = (completed: boolean) => {
    setShowQuickstart(false);
    // Mark as seen so it doesn't auto-show again
    localStorage.setItem(QUICKSTART_SEEN_KEY, 'true');

    // Set onboarding mode based on whether quickstart was completed
    if (completed) {
      setOnboardingMode('post-quickstart');
      localStorage.setItem(ONBOARDING_MODE_KEY, 'post-quickstart');
    } else {
      setOnboardingMode('regular');
      localStorage.setItem(ONBOARDING_MODE_KEY, 'regular');
    }
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
      <Onboarding mode={onboardingMode} />
    </div>
  );
}

export default App;
