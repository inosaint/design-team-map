import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import FlowChart from './components/FlowChart';
import type { AppView } from './components/Toolbar';
import Toolbar from './components/Toolbar';
import Toast from './components/Toast';
import { useStore } from './store/useStore';
import styles from './App.module.css';
import {
  ONBOARDING_COMPLETED_KEY,
  ONBOARDING_MODE_KEY,
  QUICKSTART_SEEN_KEY,
} from './constants/onboarding';

const SidePanel = lazy(() => import('./components/panels/SidePanel'));
const SettingsPanel = lazy(() => import('./components/panels/SettingsPanel'));
const QuickstartWizard = lazy(() => import('./components/QuickstartWizard'));
const Onboarding = lazy(() => import('./components/Onboarding'));
const GrowthPlan = lazy(() => import('./components/GrowthPlan'));

function App() {
  const [activeView, setActiveView] = useState<AppView>('chart');
  const [showQuickstart, setShowQuickstart] = useState(false);
  const [shouldLoadSettings, setShouldLoadSettings] = useState(
    () => useStore.getState().isSettingsOpen
  );
  const [shouldLoadOnboarding, setShouldLoadOnboarding] = useState(
    () => !localStorage.getItem(ONBOARDING_COMPLETED_KEY)
  );
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

  useEffect(() => {
    return useStore.subscribe((state) => {
      if (state.isSettingsOpen) {
        setShouldLoadSettings(true);
      }
    });
  }, []);

  const handleOpenQuickstart = () => {
    setShowQuickstart(true);
  };

  const handleViewChange = (view: AppView) => {
    setActiveView(view);
    if (view === 'growth') {
      useStore.getState().closePanel();
    }
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
    setShouldLoadOnboarding(true);
  };

  return (
    <div className={styles.app}>
      <Toolbar activeView={activeView} onViewChange={handleViewChange} />
      <main className={styles.main}>
        <div className={`${styles.viewLayer} ${activeView === 'chart' ? styles.active : ''}`}>
          <FlowChart />
        </div>
        {activeView === 'growth' && (
          <Suspense fallback={null}>
            <div className={`${styles.viewLayer} ${styles.active}`}>
              <GrowthPlan />
            </div>
          </Suspense>
        )}
      </main>
      <Suspense fallback={null}>
        {activeView === 'chart' && <SidePanel />}
        {shouldLoadSettings && <SettingsPanel onOpenQuickstart={handleOpenQuickstart} />}
      </Suspense>
      <Toast />
      <Suspense fallback={null}>
        {showQuickstart && <QuickstartWizard onClose={handleCloseQuickstart} />}
        {activeView === 'chart' && shouldLoadOnboarding && <Onboarding mode={onboardingMode} />}
      </Suspense>
    </div>
  );
}

export default App;
