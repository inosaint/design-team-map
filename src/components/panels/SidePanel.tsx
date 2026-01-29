import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, useSelectedNode } from '../../store/useStore';
import {
  getLevelName,
  calculatePromotionEligibility,
  getAvailableLevels,
  levelRequiresTrack,
} from '../../utils/calculations';
import type { CareerTrack, Gender } from '../../types';
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

  const [formData, setFormData] = useState({
    name: '',
    designerType: '',
    level: 1,
    track: undefined as CareerTrack | undefined,
    yearsOfExperience: 0,
    joiningDate: '',
    tentativeDate: '',
    managerId: '' as string | null,
    notes: '',
    gender: undefined as Gender | undefined,
  });

  // Sync form data when selected node changes
  useEffect(() => {
    if (selectedNode) {
      setFormData({
        name: selectedNode.name,
        designerType: selectedNode.designerType,
        level: selectedNode.level,
        track: selectedNode.track,
        yearsOfExperience: selectedNode.yearsOfExperience || 0,
        joiningDate: selectedNode.isPlannedHire
          ? ''
          : selectedNode.joiningDate || '',
        tentativeDate: selectedNode.isPlannedHire
          ? selectedNode.tentativeDate || ''
          : '',
        managerId: selectedNode.managerId || null,
        notes: selectedNode.notes || '',
        gender: selectedNode.gender,
      });
    }
  }, [selectedNode]);

  // Auto-save with debounce
  const saveChanges = useCallback(() => {
    if (!selectedNode) return;

    const updates: Record<string, unknown> = {
      name: formData.name,
      designerType: formData.designerType,
      level: formData.level,
      track: levelRequiresTrack(formData.level, settings) ? formData.track : undefined,
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
  }, [selectedNode, formData, settings, updateNode]);

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

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLevel = parseInt(e.target.value);
    const requiresTrack = levelRequiresTrack(newLevel, settings);

    setFormData((prev) => ({
      ...prev,
      level: newLevel,
      // Auto-select IC track if moving to a level that requires track
      track: requiresTrack && !prev.track ? 'ic' : (requiresTrack ? prev.track : undefined),
    }));
  };

  const handleTrackChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      track: e.target.value as CareerTrack,
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

  // Get potential managers (everyone except this node and their reports)
  const potentialManagers = nodes.filter(
    (n) => n.id !== selectedNode.id && n.managerId !== selectedNode.id
  );

  // Get available levels grouped by track
  const availableLevels = getAvailableLevels(settings);
  const showTrackSelection = levelRequiresTrack(formData.level, settings);

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
            name="level"
            className="select"
            value={formData.level}
            onChange={handleLevelChange}
          >
            {availableLevels.shared.length > 0 && (
              <optgroup label="Shared Levels">
                {availableLevels.shared.map((level) => (
                  <option key={`shared-${level.level}`} value={level.level}>
                    {level.name}
                  </option>
                ))}
              </optgroup>
            )}
            {availableLevels.ic.length > 0 && (
              <optgroup label="IC Track">
                {availableLevels.ic.map((level) => (
                  <option key={`ic-${level.level}`} value={level.level}>
                    {level.name}
                  </option>
                ))}
              </optgroup>
            )}
            {availableLevels.manager.length > 0 && (
              <optgroup label="Manager Track">
                {availableLevels.manager.map((level) => (
                  <option key={`manager-${level.level}`} value={level.level}>
                    {level.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {showTrackSelection && (
          <div className={styles.field}>
            <label className="label">Career Track</label>
            <select
              name="track"
              className="select"
              value={formData.track || 'ic'}
              onChange={handleTrackChange}
            >
              <option value="ic">Individual Contributor</option>
              <option value="manager">Manager</option>
            </select>
          </div>
        )}

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

        <div className={formData.managerId ? styles.fieldWithAction : styles.field}>
          <label className="label">Reports To</label>
          <div className={styles.fieldRow}>
            <select
              name="managerId"
              className="select"
              value={formData.managerId || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  managerId: e.target.value || null,
                }))
              }
            >
              <option value="">No manager (top level)</option>
              {potentialManagers.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name} - {getLevelName(node.level, settings, node.track)}
                </option>
              ))}
            </select>
            {formData.managerId && (
              <button
                className={styles.disconnectBtn}
                onClick={() => {
                  removeManager(selectedNode.id);
                  setFormData((prev) => ({ ...prev, managerId: null }));
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
