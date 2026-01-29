import { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { LevelConfig, DesignerTypeConfig } from '../../types';
import { DEFAULT_SETTINGS } from '../../types';
import styles from './SettingsPanel.module.css';

type TabType = 'levels' | 'types' | 'rules' | 'import-export';

export default function SettingsPanel() {
  const { isSettingsOpen, toggleSettings, settings, updateSettings, exportData, importData, clearAll } =
    useStore();

  const [activeTab, setActiveTab] = useState<TabType>('levels');
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);

  if (!isSettingsOpen) return null;

  const handleLevelChange = (
    index: number,
    field: keyof LevelConfig,
    value: string | number
  ) => {
    const newLevels = [...settings.levels];
    newLevels[index] = {
      ...newLevels[index],
      [field]: field === 'minYearsFromPrevious' ? parseFloat(value as string) || 0 : value,
    };
    updateSettings({ levels: newLevels });
  };

  const handleAddLevel = () => {
    const newLevel: LevelConfig = {
      level: settings.levels.length + 1,
      name: `Level ${settings.levels.length + 1}`,
      color: '#fdba74',
      minYearsFromPrevious: 2,
    };
    updateSettings({ levels: [...settings.levels, newLevel] });
  };

  const handleRemoveLevel = (index: number) => {
    if (settings.levels.length <= 1) return;
    const newLevels = settings.levels.filter((_, i) => i !== index);
    // Re-number levels
    const renumberedLevels = newLevels.map((level, i) => ({
      ...level,
      level: i + 1,
    }));
    updateSettings({ levels: renumberedLevels });
  };

  const handleTypeChange = (
    index: number,
    field: keyof DesignerTypeConfig,
    value: string
  ) => {
    const newTypes = [...settings.designerTypes];
    newTypes[index] = { ...newTypes[index], [field]: value };
    updateSettings({ designerTypes: newTypes });
  };

  const handleAddType = () => {
    const newType: DesignerTypeConfig = {
      id: `type-${Date.now()}`,
      name: 'New Type',
      abbreviation: 'NT',
    };
    updateSettings({ designerTypes: [...settings.designerTypes, newType] });
  };

  const handleRemoveType = (index: number) => {
    if (settings.designerTypes.length <= 1) return;
    const newTypes = settings.designerTypes.filter((_, i) => i !== index);
    updateSettings({ designerTypes: newTypes });
  };

  const handleExportJSON = () => {
    const data = exportData();
    const teamName = settings.teamName || 'design-team';
    const safeName = teamName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        importData(data);
      } catch {
        alert('Failed to import file. Please check the format.');
      }
    };
    input.click();
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      clearAll();
    }
  };

  const handleResetSettings = () => {
    if (confirm('Reset all settings to defaults?')) {
      updateSettings(DEFAULT_SETTINGS);
    }
  };

  return (
    <div className={styles.overlay} onClick={toggleSettings}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Settings</h2>
          <button className="btn btn-ghost btn-icon" onClick={toggleSettings}>
            x
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'levels' ? styles.active : ''}`}
            onClick={() => setActiveTab('levels')}
          >
            Levels
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'types' ? styles.active : ''}`}
            onClick={() => setActiveTab('types')}
          >
            Types
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'rules' ? styles.active : ''}`}
            onClick={() => setActiveTab('rules')}
          >
            Rules
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'import-export' ? styles.active : ''}`}
            onClick={() => setActiveTab('import-export')}
          >
            Import/Export
          </button>
        </div>

        <div className={styles.content}>
          {activeTab === 'levels' && (
            <div className={styles.section}>
              <p className={styles.sectionDesc}>
                Configure career levels and promotion requirements. IC/Manager tracks split at level {settings.trackSplitLevel}.{' '}
                <button
                  className={styles.linkBtn}
                  onClick={() => setActiveTab('rules')}
                >
                  Customize →
                </button>
              </p>

              <div className={styles.levelsList}>
                {settings.levels.map((level, index) => {
                  const isExpanded = expandedLevel === index;
                  const isManagerTrack = level.level >= settings.trackSplitLevel && level.track === 'manager';

                  return (
                    <div key={index} className={styles.levelItem}>
                      <div
                        className={styles.levelAccordion}
                        onClick={() => setExpandedLevel(isExpanded ? null : index)}
                      >
                        <div className={styles.levelPreview}>
                          <span
                            className={styles.levelColorDot}
                            style={{ backgroundColor: level.color }}
                          />
                          <span className={styles.levelName}>{level.name}</span>
                          {level.level >= settings.trackSplitLevel && (
                            <span className={`${styles.trackBadge} ${isManagerTrack ? styles.manager : ''}`}>
                              {isManagerTrack ? 'MGR' : 'IC'}
                            </span>
                          )}
                        </div>
                        <div className={styles.levelActions}>
                          <button
                            className={styles.removeBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveLevel(index);
                            }}
                            disabled={settings.levels.length <= 1}
                          >
                            ×
                          </button>
                          <span className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`}>
                            ▼
                          </span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className={styles.levelFields}>
                          <div className={styles.field}>
                            <label className="label">Name</label>
                            <input
                              type="text"
                              className="input"
                              value={level.name}
                              onChange={(e) =>
                                handleLevelChange(index, 'name', e.target.value)
                              }
                            />
                          </div>
                          <div className={styles.fieldRow}>
                            <div className={styles.field}>
                              <label className="label">Color</label>
                              <input
                                type="color"
                                className={styles.colorInput}
                                value={level.color}
                                onChange={(e) =>
                                  handleLevelChange(index, 'color', e.target.value)
                                }
                              />
                            </div>
                            <div className={styles.field}>
                              <label className="label">Min Years</label>
                              <input
                                type="number"
                                className="input"
                                value={level.minYearsFromPrevious}
                                onChange={(e) =>
                                  handleLevelChange(
                                    index,
                                    'minYearsFromPrevious',
                                    e.target.value
                                  )
                                }
                                min="0"
                                step="0.5"
                              />
                            </div>
                          </div>
                          {/* Show track toggle for levels at or above split level */}
                          {level.level >= settings.trackSplitLevel && (
                            <div className={styles.trackToggle}>
                              <span className={styles.trackLabel}>Manager Track</span>
                              <label className={styles.toggleSmall}>
                                <input
                                  type="checkbox"
                                  checked={level.track === 'manager'}
                                  onChange={(e) =>
                                    handleLevelChange(
                                      index,
                                      'track',
                                      e.target.checked ? 'manager' : 'ic'
                                    )
                                  }
                                />
                                <span className={styles.toggleSliderSmall}></span>
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                className="btn btn-secondary"
                onClick={handleAddLevel}
                style={{ marginTop: 'var(--space-3)' }}
              >
                + Add Level
              </button>
            </div>
          )}

          {activeTab === 'types' && (
            <div className={styles.section}>
              <p className={styles.sectionDesc}>
                Configure designer specialization types.
              </p>

              <div className={styles.typesList}>
                {settings.designerTypes.map((type, index) => (
                  <div key={type.id} className={styles.typeItem}>
                    <div className={styles.typeFields}>
                      <div className={styles.field} style={{ flex: 2 }}>
                        <label className="label">Name</label>
                        <input
                          type="text"
                          className="input"
                          value={type.name}
                          onChange={(e) =>
                            handleTypeChange(index, 'name', e.target.value)
                          }
                        />
                      </div>
                      <div className={styles.field} style={{ flex: 1 }}>
                        <label className="label">Abbr</label>
                        <input
                          type="text"
                          className="input"
                          value={type.abbreviation}
                          onChange={(e) =>
                            handleTypeChange(
                              index,
                              'abbreviation',
                              e.target.value.toUpperCase()
                            )
                          }
                          maxLength={3}
                        />
                      </div>
                      <button
                        className={styles.removeBtn}
                        onClick={() => handleRemoveType(index)}
                        disabled={settings.designerTypes.length <= 1}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="btn btn-secondary"
                onClick={handleAddType}
                style={{ marginTop: 'var(--space-3)' }}
              >
                + Add Type
              </button>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className={styles.section}>
              <p className={styles.sectionDesc}>
                Configure team structure rules and display options.
              </p>

              <div className={styles.field}>
                <label className="label">Span of Control Threshold</label>
                <p className={styles.fieldDesc}>
                  Maximum direct reports before showing warning (research suggests 6-8 is optimal)
                </p>
                <input
                  type="number"
                  className="input"
                  value={settings.spanOfControlThreshold}
                  onChange={(e) =>
                    updateSettings({
                      spanOfControlThreshold: parseInt(e.target.value) || 6,
                    })
                  }
                  min="1"
                  max="20"
                  style={{ maxWidth: '100px' }}
                />
              </div>

              <div className={styles.field}>
                <label className="label">Track Split Level</label>
                <p className={styles.fieldDesc}>
                  Level at which IC and Manager tracks diverge
                </p>
                <input
                  type="number"
                  className="input"
                  value={settings.trackSplitLevel}
                  onChange={(e) =>
                    updateSettings({
                      trackSplitLevel: parseInt(e.target.value) || 4,
                    })
                  }
                  min="1"
                  max="10"
                  style={{ maxWidth: '100px' }}
                />
              </div>

              <div className={styles.toggleField}>
                <div className={styles.toggleInfo}>
                  <label className="label">Show Gender Field</label>
                  <p className={styles.fieldDesc}>
                    Enable gender field for team members (useful for diversity tracking)
                  </p>
                </div>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={settings.showGender || false}
                    onChange={(e) =>
                      updateSettings({ showGender: e.target.checked })
                    }
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>

              <div className={styles.toggleField}>
                <div className={styles.toggleInfo}>
                  <label className="label">Show Minimap</label>
                  <p className={styles.fieldDesc}>
                    Display a minimap for easier navigation on large team maps
                  </p>
                </div>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={settings.showMinimap || false}
                    onChange={(e) =>
                      updateSettings({ showMinimap: e.target.checked })
                    }
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'import-export' && (
            <div className={styles.section}>
              <div className={styles.field}>
                <label className="label">Export</label>
                <p className={styles.fieldDesc}>
                  Download your team map data
                </p>
                <button className="btn btn-secondary" onClick={handleExportJSON}>
                  Export JSON
                </button>
                <p className={styles.fieldHint}>
                  Other formats (PDF, Image) coming soon
                </p>
              </div>

              <div className={styles.field}>
                <label className="label">Import</label>
                <p className={styles.fieldDesc}>
                  Import a previously exported JSON file
                </p>
                <button className="btn btn-secondary" onClick={handleImport}>
                  Import JSON
                </button>
              </div>

              <div className={styles.field}>
                <label className="label">Delete Data</label>
                <p className={styles.fieldDesc}>
                  These actions cannot be undone
                </p>
                <div className={styles.buttonGroup}>
                  <button
                    className="btn btn-secondary"
                    onClick={handleResetSettings}
                  >
                    Reset Settings
                  </button>
                  <button className="btn btn-danger" onClick={handleClearAll}>
                    Clear All Data
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
