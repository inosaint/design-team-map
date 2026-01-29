import FlowChart from './components/FlowChart';
import Toolbar from './components/Toolbar';
import SidePanel from './components/panels/SidePanel';
import SettingsPanel from './components/panels/SettingsPanel';
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
    </div>
  );
}

export default App;
