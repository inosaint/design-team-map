import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import FlowChart from './components/FlowChart';
import type { AppView } from './components/Toolbar';
import type { QuickstartCloseReason } from './components/QuickstartWizard';
import Toolbar from './components/Toolbar';
import Toast from './components/Toast';
import { useStore } from './store/useStore';
import { useToastStore } from './store/useToastStore';
import { isImportData, decodeChartFromUrl } from './utils/importData';
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

const GROWTH_PLAN_HASH = '#growth-plan';

const getViewFromHash = (): AppView =>
  window.location.hash === GROWTH_PLAN_HASH ? 'growth' : 'chart';

function App() {
  const [activeView, setActiveView] = useState<AppView>(getViewFromHash);
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

    // Small delay to let the store hydrate from localStorage.
    // Note: no cleanup/clearTimeout here on purpose - in dev, StrictMode mounts this
    // effect, cleans it up, then mounts it again; if we cleared the timer on that
    // synthetic cleanup, the `hasCheckedInitialRef` guard would block the second
    // mount from ever arming a new one, and this would silently never fire.
    setTimeout(() => {
      // A `?chart=` param lets an agent (or anyone) load a chart via link, reusing the
      // same import contract as the JSON file import in Settings (see utils/importData.ts).
      const chartParam = new URLSearchParams(window.location.search).get('chart');
      if (chartParam) {
        try {
          const data = decodeChartFromUrl(chartParam);
          if (!isImportData(data)) throw new Error('Invalid chart data');
          useStore.getState().importData(data);
          // Agents building a chart URL usually won't compute pixel positions -
          // auto-arrange into a hierarchy unless positions were explicitly supplied.
          if (!data.nodePositions) {
            useStore.getState().autoArrangeNodes();
          }
          useToastStore.getState().showToast('Chart imported from link', 'success');
        } catch (err) {
          console.error('Failed to import chart from URL:', err);
          useToastStore.getState().showToast('Failed to import chart from link', 'error');
        } finally {
          // Always strip `chart` from the URL, even if import failed, so a refresh
          // or re-share doesn't repeatedly reattempt (or repeatedly fail) the same import.
          window.history.replaceState(null, '', window.location.pathname + window.location.hash);
        }
        return;
      }

      const hasSeenQuickstart = localStorage.getItem(QUICKSTART_SEEN_KEY) === 'true';
      const currentNodes = useStore.getState().nodes;
      if (currentNodes.length === 0 && !hasSeenQuickstart) {
        setShowQuickstart(true);
      }
    }, 100);
  }, []);

  useEffect(() => {
    return useStore.subscribe((state) => {
      if (state.isSettingsOpen) {
        setShouldLoadSettings(true);
      }
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditableTarget =
        !!target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (isEditableTarget) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        const { selectedNodeId, deleteNode } = useStore.getState();
        if (selectedNodeId) {
          deleteNode(selectedNodeId);
        }
      } else if (e.key === 'Escape') {
        const { isPanelOpen, closePanel } = useStore.getState();
        if (isPanelOpen) {
          closePanel();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleLocationChange = () => {
      const nextView = getViewFromHash();
      setActiveView(nextView);
      if (nextView === 'growth') {
        useStore.getState().closePanel();
      }
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const handleOpenQuickstart = () => {
    setShowQuickstart(true);
  };

  const handleViewChange = (view: AppView) => {
    setActiveView(view);
    if (view === 'growth') {
      useStore.getState().closePanel();
      if (window.location.hash !== GROWTH_PLAN_HASH) {
        window.history.pushState(null, '', GROWTH_PLAN_HASH);
      }
    } else if (window.location.hash === GROWTH_PLAN_HASH) {
      window.history.pushState(null, '', `${window.location.pathname}${window.location.search}`);
    }
  };

  const handleCloseQuickstart = (reason: QuickstartCloseReason) => {
    setShowQuickstart(false);
    // Mark as seen so it doesn't auto-show again
    localStorage.setItem(QUICKSTART_SEEN_KEY, 'true');

    if (reason === 'skip-onboarding') {
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      setOnboardingMode(undefined);
      setShouldLoadOnboarding(false);
      return;
    }

    // Set onboarding mode based on whether quickstart was completed
    if (reason === 'completed') {
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
