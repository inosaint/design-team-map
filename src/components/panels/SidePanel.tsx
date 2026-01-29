import { useState, useEffect } from 'react';
import { useStore, useSelectedNode } from '../../store/useStore';
import {
  getLevelName,
  calculatePromotionEligibility,
} from '../../utils/calculations';
import styles from './SidePanel.module.css';

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

  const [formData, setFormData] = useState({
    name: '',
    designerType: '',
    level: 1,
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

  const handleSave = () => {
    const updates: Record<string, unknown> = {
      name: formData.name,
      designerType: formData.designerType,
      level: formData.level,
      yearsOfExperience: formData.yearsOfExperience,
      managerId: formData.managerId || null,
    };

    if (selectedNode.isPlannedHire) {
      updates.tentativeDate = formData.tentativeDate;
    } else {
      updates.joiningDate = formData.joiningDate;
    }

    updateNode(selectedNode.id, updates);
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

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3>{selectedNode.isPlannedHire ? 'Planned Hire' : 'Team Member'}</h3>
        <button className="btn btn-ghost btn-icon" onClick={closePanel}>
          x
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
            onChange={handleChange}
          >
            {settings.levels.map((level) => (
              <option key={level.level} value={level.level}>
                {level.name}
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
                {node.name} - {getLevelName(node.level, settings)}
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
                {getLevelName(selectedNode.level + 1, settings)}
              </p>
            ) : promotionInfo.yearsUntilEligible > 0 ? (
              <p className={styles.notEligible}>
                {promotionInfo.yearsUntilEligible.toFixed(1)} years until
                eligible for {getLevelName(selectedNode.level + 1, settings)}
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
        <button className="btn btn-primary" onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
}
