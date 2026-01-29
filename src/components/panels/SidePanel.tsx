import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore, useSelectedNode } from '../../store/useStore';
import {
  getLevelName,
  calculatePromotionEligibility,
  getAvailableLevels,
  levelRequiresTrack,
} from '../../utils/calculations';
import type { CareerTrack } from '../../types';
import styles from './SidePanel.module.css';

// Debounce delay in ms
const DEBOUNCE_DELAY = 300;

export default function SidePanel() {
  const {
    isPanelOpen,
    closePanel,
    settings,
    updateNode,
    deleteNode,
    convertToHired,
    nodes,
  } = useStore();

  const selectedNode = useSelectedNode();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    designerType: '',
    level: 1,
    track: undefined as CareerTrack | undefined,
    yearsOfExperience: 0,
    joiningDate: '',
    tentativeDate: '',
    managerId: '' as string | null,
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
      managerId: formData.managerId || null,
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

  if (!isPanelOpen || !selectedNode) {
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

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3>{selectedNode.isPlannedHire ? 'Planned Hire' : 'Team Member'}</h3>
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

        <div className={styles.field}>
          <label className="label">Reports To</label>
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

        {/* Promotion eligibility info */}
        {!selectedNode.isPlannedHire && (
          <div className={styles.infoBox}>
            <h4>Growth Status</h4>
            {promotionInfo.eligible ? (
              <p className={styles.eligible}>
                Eligible for promotion to{' '}
                {getLevelName(selectedNode.level + 1, settings, selectedNode.track)}
              </p>
            ) : promotionInfo.yearsUntilEligible > 0 ? (
              <p className={styles.notEligible}>
                {promotionInfo.yearsUntilEligible.toFixed(1)} years until
                eligible for {getLevelName(selectedNode.level + 1, settings, selectedNode.track)}
              </p>
            ) : (
              <p className={styles.maxLevel}>At maximum level</p>
            )}
          </div>
        )}
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
