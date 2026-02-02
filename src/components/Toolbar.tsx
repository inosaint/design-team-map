import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { trackTeamNameChanged } from '../utils/analytics';
import styles from './Toolbar.module.css';

export default function Toolbar() {
  const { addTeamMember, addPlannedHire, toggleSettings, settings, nodes, updateSettings } =
    useStore();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(settings.teamName || 'My Team');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    setEditedName(settings.teamName || 'My Team');
  }, [settings.teamName]);

  const handleAddTeamMember = () => {
    addTeamMember({
      name: 'New Member',
      designerType: '', // Empty string shows "Select type..." placeholder
      level: 1,
      yearsOfExperience: 0,
      managerId: undefined, // undefined = unassigned, can have manager
    });
    setShowAddMenu(false);
  };

  const handleAddPlannedHire = () => {
    addPlannedHire({
      name: 'TBD',
      designerType: '', // Empty string shows "Select type..." placeholder
      level: 1,
      tentativeDate: 'Q1 2025',
      managerId: undefined, // undefined = unassigned, can have manager
    });
    setShowAddMenu(false);
  };

  const handleNameSave = () => {
    const trimmedName = editedName.trim();
    if (trimmedName) {
      const previousName = settings.teamName || 'Design Team';
      updateSettings({ teamName: trimmedName });
      // Only track if name actually changed
      if (trimmedName !== previousName) {
        trackTeamNameChanged();
      }
    } else {
      setEditedName(settings.teamName || 'My Team');
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setEditedName(settings.teamName || 'My Team');
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
            {settings.teamName || 'My Team'}
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
            data-testid="add-member-btn"
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

        <button className="btn btn-secondary" onClick={toggleSettings} data-testid="settings-btn">
          Settings
        </button>
      </div>
    </div>
  );
}
