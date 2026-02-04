import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, useSelectedNode } from '../../store/useStore';
import {
  getLevelName,
  calculatePromotionEligibility,
  getAvailableLevelsFlat,
  wouldCreateCircularReference,
} from '../../utils/calculations';
import type { CareerTrack, Gender, LevelConfig } from '../../types';
import styles from './SidePanel.module.css';

// Disconnect icon SVG
const DisconnectIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);

// Debounce delay in ms
const DEBOUNCE_DELAY = 300;

export default function SidePanel() {
  const {
    isPanelOpen,
    closePanel,
    settings,
    updateNode,
    deleteNode,
    removeManager,
    convertToHired,
    nodes,
  } = useStore();

  const selectedNode = useSelectedNode();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Handle open/close animations
  // This is intentional - we need to manage animation state based on panel state
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isPanelOpen && selectedNode) {
      setIsVisible(true);
      setIsClosing(false);
    } else if (isVisible && !isPanelOpen) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 150); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isPanelOpen, selectedNode, isVisible]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const [formData, setFormData] = useState({
    name: '',
    designerType: '',
    levelConfigId: '', // Now store the level config ID which includes track info
    yearsOfExperience: 0,
    joiningDate: '',
    tentativeDate: '',
    managerId: undefined as string | null | undefined,
    notes: '',
    gender: undefined as Gender | undefined,
  });

  // Helper to find level config ID from level + track
  const getLevelConfigId = useCallback((level: number, track?: CareerTrack): string => {
    const levels = getAvailableLevelsFlat(settings);
    // Find matching level config
    const config = levels.find(l => {
      if (l.isMaxLevel && l.level === level) return true;
      if (l.level === level && l.track === track) return true;
      if (l.level === level && !l.track && !track) return true;
      return false;
    });
    return config?.id || levels[0]?.id || '';
  }, [settings]);

  // Helper to get level config from ID
  const getLevelConfigFromId = useCallback((id: string): LevelConfig | undefined => {
    const levels = getAvailableLevelsFlat(settings);
    return levels.find(l => l.id === id);
  }, [settings]);

  // Sync form data when selected node changes
  // This is intentional - we need to populate form when selection changes
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (selectedNode) {
      setFormData({
        name: selectedNode.name,
        designerType: selectedNode.designerType,
        levelConfigId: getLevelConfigId(selectedNode.level, selectedNode.track),
        yearsOfExperience: selectedNode.yearsOfExperience || 0,
        joiningDate: selectedNode.isPlannedHire
          ? ''
          : selectedNode.joiningDate || '',
        tentativeDate: selectedNode.isPlannedHire
          ? selectedNode.tentativeDate || ''
          : '',
        managerId: selectedNode.managerId, // preserve undefined vs null
        notes: selectedNode.notes || '',
        gender: selectedNode.gender,
      });
    }
  }, [selectedNode, getLevelConfigId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Auto-save with debounce
  const saveChanges = useCallback(() => {
    if (!selectedNode) return;

    // Get level and track from the selected level config
    const levelConfig = getLevelConfigFromId(formData.levelConfigId);
    const level = levelConfig?.level || 1;
    const track = levelConfig?.track;

    const updates: Record<string, unknown> = {
      name: formData.name,
      designerType: formData.designerType,
      level,
      track,
      yearsOfExperience: formData.yearsOfExperience,
      managerId: formData.managerId,
      notes: formData.notes,
      gender: formData.gender,
    };

    if (selectedNode.isPlannedHire) {
      updates.tentativeDate = formData.tentativeDate;
    } else {
      updates.joiningDate = formData.joiningDate;
    }

    updateNode(selectedNode.id, updates);
  }, [selectedNode, formData, getLevelConfigFromId, updateNode]);

  // Debounced save effect
  useEffect(() => {
    if (!selectedNode) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      saveChanges();
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [formData, selectedNode, saveChanges]);

  if (!isVisible || !selectedNode) {
    return null;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleLevelConfigChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      levelConfigId: e.target.value,
    }));
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to remove this team member?')) {
      deleteNode(selectedNode.id);
    }
  };

  const handleConvertToHired = () => {
    const today = new Date().toISOString().split('T')[0];
    convertToHired(selectedNode.id, today);
  };

  const promotionInfo = calculatePromotionEligibility(selectedNode, settings);

  // Get potential managers (everyone except this node and nodes that would create a circular reference)
  const potentialManagers = nodes.filter((n) => {
    if (n.id === selectedNode.id) return false;
    // Exclude nodes where setting them as manager would create a loop
    if (wouldCreateCircularReference(selectedNode.id, n.id, nodes)) return false;
    return true;
  });

  // Get available levels as a flat list
  const availableLevels = getAvailableLevelsFlat(settings);

  // Get growth status text for the tag
  const getGrowthStatusTag = () => {
    if (selectedNode.isPlannedHire) return null;
    if (promotionInfo.eligible) {
      return { text: 'Ready for promotion', type: 'success' };
    }
    if (promotionInfo.yearsUntilEligible > 0) {
      return {
        text: `${promotionInfo.yearsUntilEligible.toFixed(1)}y to next level`,
        type: 'neutral',
      };
    }
    return { text: 'At max level', type: 'muted' };
  };

  const growthTag = getGrowthStatusTag();

  return (
    <div className={`${styles.panel} ${isClosing ? styles.closing : ''}`}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h3>{selectedNode.isPlannedHire ? 'Planned Hire' : 'Team Member'}</h3>
          {growthTag && (
            <span className={`${styles.growthTag} ${styles[growthTag.type]}`}>
              {growthTag.text}
            </span>
          )}
        </div>
        <button className="btn btn-ghost btn-icon" onClick={closePanel}>
          ×
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.field}>
          <label className="label">Name</label>
          <input
            type="text"
            name="name"
            className="input"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter name"
          />
        </div>

        <div className={styles.field}>
          <label className="label">Designer Type</label>
          <select
            name="designerType"
            className="select"
            value={formData.designerType}
            onChange={handleChange}
          >
            <option value="">Select type...</option>
            {settings.designerTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className="label">Level</label>
          <select
            name="levelConfigId"
            className="select"
            value={formData.levelConfigId}
            onChange={handleLevelConfigChange}
          >
            {availableLevels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name}
                {level.track && ` (${level.track === 'ic' ? 'IC' : 'Manager'})`}
                {level.isMaxLevel && ' (Head)'}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className="label">Years of Experience</label>
          <input
            type="number"
            name="yearsOfExperience"
            className="input"
            value={formData.yearsOfExperience}
            onChange={handleChange}
            min="0"
            step="0.5"
          />
        </div>

        {settings.showGender && (
          <div className={styles.field}>
            <label className="label">Gender</label>
            <select
              name="gender"
              className="select"
              value={formData.gender || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  gender: (e.target.value || undefined) as Gender | undefined,
                }))
              }
            >
              <option value="">Not specified</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>
        )}

        <div className={typeof formData.managerId === 'string' ? styles.fieldWithAction : styles.field}>
          <label className="label">Reports To</label>
          <div className={styles.fieldRow}>
            <select
              name="managerId"
              className="select"
              value={formData.managerId === null ? '__TOP_LEVEL__' : (formData.managerId || '')}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  managerId: value === '__TOP_LEVEL__' ? null : (value || undefined),
                }));
              }}
            >
              <option value="">Select manager...</option>
              <option value="__TOP_LEVEL__">No manager (top level)</option>
              {potentialManagers.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name} - {getLevelName(node.level, settings, node.track)}
                </option>
              ))}
            </select>
            {typeof formData.managerId === 'string' && (
              <button
                className={styles.disconnectBtn}
                onClick={() => {
                  removeManager(selectedNode.id);
                  setFormData((prev) => ({ ...prev, managerId: undefined }));
                }}
                title="Disconnect from manager"
              >
                <DisconnectIcon />
              </button>
            )}
          </div>
        </div>

        {selectedNode.isPlannedHire ? (
          <div className={styles.field}>
            <label className="label">Tentative Date</label>
            <input
              type="text"
              name="tentativeDate"
              className="input"
              value={formData.tentativeDate}
              onChange={handleChange}
              placeholder="e.g., Q2 2025, March 2025"
            />
          </div>
        ) : (
          <div className={styles.field}>
            <label className="label">Joining Date</label>
            <input
              type="date"
              name="joiningDate"
              className="input"
              value={formData.joiningDate}
              onChange={handleChange}
            />
          </div>
        )}

        <div className={styles.field}>
          <label className="label">Notes</label>
          <textarea
            name="notes"
            className={`input ${styles.notesInput}`}
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                notes: e.target.value,
              }))
            }
            placeholder="Add notes..."
            rows={3}
          />
        </div>

      </div>

      <div className={styles.footer}>
        {selectedNode.isPlannedHire && (
          <button
            className="btn btn-secondary"
            onClick={handleConvertToHired}
          >
            Mark as Hired
          </button>
        )}
        <button className="btn btn-danger" onClick={handleDelete}>
          Remove
        </button>
      </div>
    </div>
  );
}
