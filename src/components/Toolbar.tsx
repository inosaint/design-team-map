import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import styles from './Toolbar.module.css';

export default function Toolbar() {
  const { addTeamMember, addPlannedHire, toggleSettings, settings, nodes, updateSettings } =
    useStore();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(settings.teamName || 'Design Team');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    setEditedName(settings.teamName || 'Design Team');
  }, [settings.teamName]);

  const handleAddTeamMember = () => {
    const defaultType = settings.designerTypes[0]?.id || 'product';
    addTeamMember({
      name: 'New Designer',
      designerType: defaultType,
      level: 1,
      yearsOfExperience: 0,
      managerId: undefined, // undefined = unassigned, can have manager
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
      managerId: undefined, // undefined = unassigned, can have manager
    });
    setShowAddMenu(false);
  };

  const handleNameSave = () => {
    const trimmedName = editedName.trim();
    if (trimmedName) {
      updateSettings({ teamName: trimmedName });
    } else {
      setEditedName(settings.teamName || 'Design Team');
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setEditedName(settings.teamName || 'Design Team');
      setIsEditingName(false);
    }
  };

  const teamCount = nodes.filter((n) => !n.isPlannedHire).length;
  const plannedCount = nodes.filter((n) => n.isPlannedHire).length;

  return (
    <div className={styles.toolbar}>
      <div className={styles.left}>
        <img src="/design-team-mapper.svg" alt="Logo" className={styles.logo} />
        {isEditingName ? (
          <input
            ref={inputRef}
            type="text"
            className={styles.titleInput}
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={handleNameKeyDown}
          />
        ) : (
          <h1
            className={styles.title}
            onClick={() => setIsEditingName(true)}
            title="Click to edit team name"
          >
            {settings.teamName || 'Design Team'}
          </h1>
        )}
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
