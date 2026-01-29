import { useState } from 'react';
import { useStore } from '../store/useStore';
import styles from './Toolbar.module.css';

export default function Toolbar() {
  const { addTeamMember, addPlannedHire, toggleSettings, settings, nodes } =
    useStore();
  const [showAddMenu, setShowAddMenu] = useState(false);

  const handleAddTeamMember = () => {
    const defaultType = settings.designerTypes[0]?.id || 'product';
    addTeamMember({
      name: 'New Designer',
      designerType: defaultType,
      level: 1,
      yearsOfExperience: 0,
      managerId: null,
    });
    setShowAddMenu(false);
  };

  const handleAddPlannedHire = () => {
    const defaultType = settings.designerTypes[0]?.id || 'product';
    addPlannedHire({
      name: 'TBD',
      designerType: defaultType,
      level: 1,
      tentativeDate: 'Q1 2025',
      managerId: null,
    });
    setShowAddMenu(false);
  };

  const teamCount = nodes.filter((n) => !n.isPlannedHire).length;
  const plannedCount = nodes.filter((n) => n.isPlannedHire).length;

  return (
    <div className={styles.toolbar}>
      <div className={styles.left}>
        <h1 className={styles.title}>Design Team Map</h1>
        <div className={styles.stats}>
          <span className={styles.stat}>
            <strong>{teamCount}</strong> members
          </span>
          {plannedCount > 0 && (
            <span className={styles.stat}>
              <strong>{plannedCount}</strong> planned
            </span>
          )}
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.addWrapper}>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddMenu(!showAddMenu)}
          >
            + Add
          </button>
          {showAddMenu && (
            <div className={styles.addMenu}>
              <button
                className={styles.menuItem}
                onClick={handleAddTeamMember}
              >
                <span className={styles.menuIcon}>+</span>
                <div>
                  <div className={styles.menuTitle}>Team Member</div>
                  <div className={styles.menuDesc}>Add existing designer</div>
                </div>
              </button>
              <button
                className={styles.menuItem}
                onClick={handleAddPlannedHire}
              >
                <span className={styles.menuIcon}>+</span>
                <div>
                  <div className={styles.menuTitle}>Planned Hire</div>
                  <div className={styles.menuDesc}>Add future position</div>
                </div>
              </button>
            </div>
          )}
        </div>

        <button className="btn btn-secondary" onClick={toggleSettings}>
          Settings
        </button>
      </div>
    </div>
  );
}
