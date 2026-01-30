import FlowChart from './components/FlowChart';
import Toolbar from './components/Toolbar';
import SidePanel from './components/panels/SidePanel';
import SettingsPanel from './components/panels/SettingsPanel';
import Toast from './components/Toast';
import Onboarding from './components/Onboarding';
import styles from './App.module.css';

function App() {
  return (
    <div className={styles.app}>
      <Toolbar />
      <main className={styles.main}>
        <FlowChart />
      </main>
      <SidePanel />
      <SettingsPanel />
      <Toast />
      <Onboarding />
    </div>
  );
}

export default App;
