import { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { LevelConfig, DesignerTypeConfig } from '../../types';
import { DEFAULT_SETTINGS } from '../../types';
import { regenerateLevelsForSplitLevel, generateLevelId } from '../../utils/calculations';
import styles from './SettingsPanel.module.css';

type TabType = 'levels' | 'types' | 'advanced' | 'about' | 'import-export';

interface SettingsPanelProps {
  onOpenQuickstart?: () => void;
}

export default function SettingsPanel({ onOpenQuickstart }: SettingsPanelProps) {
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
    // Get max level number
    const maxLevelNum = Math.max(...settings.levels.map(l => l.level));
    const headLevel = settings.levels.find(l => l.isMaxLevel);

    // If we have a head level, we need to:
    // 1. Add new IC and Manager levels at the current max level position
    // 2. Move head level to max + 1
    if (headLevel) {
      const newLevels = settings.levels.filter(l => !l.isMaxLevel);

      // Add IC track level
      newLevels.push({
        id: generateLevelId(maxLevelNum, 'ic'),
        level: maxLevelNum,
        name: `IC Level ${maxLevelNum}`,
        color: '#EA580C',
        minYearsFromPrevious: 3,
        track: 'ic',
      });

      // Add Manager track level
      newLevels.push({
        id: generateLevelId(maxLevelNum, 'manager'),
        level: maxLevelNum,
        name: `Manager Level ${maxLevelNum}`,
        color: '#4ADE80',
        minYearsFromPrevious: 3,
        track: 'manager',
      });

      // Move head level up
      newLevels.push({
        ...headLevel,
        id: generateLevelId(maxLevelNum + 1, undefined, true),
        level: maxLevelNum + 1,
      });

      updateSettings({ levels: newLevels });
    } else {
      // No head level yet, add a basic level
      const newLevel: LevelConfig = {
        id: generateLevelId(maxLevelNum + 1),
        level: maxLevelNum + 1,
        name: `Level ${maxLevelNum + 1}`,
        color: '#fdba74',
        minYearsFromPrevious: 2,
      };
      updateSettings({ levels: [...settings.levels, newLevel] });
    }
  };

  const handleRemoveLevel = (index: number) => {
    if (settings.levels.length <= 1) return;

    const levelToRemove = settings.levels[index];

    // If removing the head level, just remove it (allows flexibility for multi-discipline orgs)
    if (levelToRemove.isMaxLevel) {
      const newLevels = settings.levels.filter((_, i) => i !== index);
      updateSettings({ levels: newLevels });
      return;
    }

    // If removing a track-specific level, also remove its counterpart
    if (levelToRemove.track) {
      const counterpartTrack = levelToRemove.track === 'ic' ? 'manager' : 'ic';
      const counterpart = settings.levels.find(
        l => l.level === levelToRemove.level && l.track === counterpartTrack
      );

      let newLevels = settings.levels.filter(l =>
        l.id !== levelToRemove.id && l.id !== counterpart?.id
      );

      // Renumber remaining levels and update head level
      newLevels = renumberLevels(newLevels, settings.trackSplitLevel);
      updateSettings({ levels: newLevels });
    } else {
      // Removing a shared level
      let newLevels = settings.levels.filter((_, i) => i !== index);
      newLevels = renumberLevels(newLevels, settings.trackSplitLevel);
      updateSettings({ levels: newLevels });
    }
  };

  // Helper to renumber levels after removal
  const renumberLevels = (levels: LevelConfig[], splitLevel: number): LevelConfig[] => {
    // Group levels
    const shared = levels.filter(l => !l.track && !l.isMaxLevel).sort((a, b) => a.level - b.level);
    const ic = levels.filter(l => l.track === 'ic').sort((a, b) => a.level - b.level);
    const manager = levels.filter(l => l.track === 'manager').sort((a, b) => a.level - b.level);
    const head = levels.find(l => l.isMaxLevel);

    const result: LevelConfig[] = [];

    // Renumber shared levels (1 to splitLevel - 1)
    shared.forEach((l, i) => {
      const newLevel = i + 1;
      result.push({ ...l, id: generateLevelId(newLevel), level: newLevel });
    });

    // Renumber IC/Manager levels
    const splitLevelCount = Math.max(ic.length, manager.length);
    for (let i = 0; i < splitLevelCount; i++) {
      const levelNum = splitLevel + i;
      if (ic[i]) {
        result.push({ ...ic[i], id: generateLevelId(levelNum, 'ic'), level: levelNum });
      }
      if (manager[i]) {
        result.push({ ...manager[i], id: generateLevelId(levelNum, 'manager'), level: levelNum });
      }
    }

    // Add head at the end
    if (head) {
      const maxLevel = splitLevel + splitLevelCount;
      result.push({ ...head, id: generateLevelId(maxLevel, undefined, true), level: maxLevel });
    }

    return result;
  };

  const handleTrackSplitLevelChange = (newSplitLevel: number) => {
    const maxLevel = Math.max(...settings.levels.map(l => l.level));

    // Validate: split level must be at least 2 and less than max level
    if (newSplitLevel < 2 || newSplitLevel >= maxLevel) {
      return;
    }

    const newLevels = regenerateLevelsForSplitLevel(settings.levels, newSplitLevel, maxLevel);
    updateSettings({ levels: newLevels, trackSplitLevel: newSplitLevel });
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
            className={`${styles.tab} ${activeTab === 'advanced' ? styles.active : ''}`}
            onClick={() => setActiveTab('advanced')}
          >
            Advanced
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'about' ? styles.active : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
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
                  onClick={() => setActiveTab('advanced')}
                >
                  Customize →
                </button>
              </p>

              <div className={styles.levelsList}>
                {settings.levels.map((level, index) => {
                  const isExpanded = expandedLevel === index;
                  const isManagerTrack = level.track === 'manager';
                  const isHeadLevel = level.isMaxLevel;

                  return (
                    <div key={level.id || index} className={styles.levelItem}>
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
                          {isHeadLevel ? (
                            <span className={`${styles.trackBadge} ${styles.head}`}>
                              HEAD
                            </span>
                          ) : level.track && (
                            <span className={`${styles.trackBadge} ${isManagerTrack ? styles.manager : ''}`}>
                              {isManagerTrack ? 'MGR' : 'IC'}
                            </span>
                          )}
                        </div>
                        <span className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`}>
                          ▼
                        </span>
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
                          {/* Track info - read only, determined by split level setting */}
                          {(level.track || isHeadLevel) && (
                            <div className={styles.trackInfo}>
                              <span className={styles.trackInfoLabel}>
                                {isHeadLevel
                                  ? 'This is the top level where both career tracks converge.'
                                  : `This is a ${isManagerTrack ? 'Manager' : 'IC'} track level. Change the split level in Advanced settings to modify.`}
                              </span>
                            </div>
                          )}
                          <button
                            className={styles.removeLevelBtn}
                            onClick={() => handleRemoveLevel(index)}
                            disabled={settings.levels.length <= 1}
                            title="Remove level"
                          >
                            Remove
                          </button>
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

          {activeTab === 'advanced' && (
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
                  Level at which IC and Manager career tracks diverge. Changing this will regenerate levels.
                </p>
                <input
                  type="number"
                  className="input"
                  value={settings.trackSplitLevel}
                  onChange={(e) => handleTrackSplitLevelChange(parseInt(e.target.value) || 4)}
                  min="2"
                  max={Math.max(...settings.levels.map(l => l.level)) - 1}
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

          {activeTab === 'about' && (
            <div className={styles.section}>
              <div className={styles.aboutHeader}>
<h3 className={styles.aboutTitle}>Org Mapper</h3>
                <span className={styles.version}>v0.3.0</span>
              </div>

              <p className={styles.aboutDesc}>
                A tool for visualizing and planning team structures, career progression, and growth opportunities across any industry.
              </p>

              <div className={styles.aboutLinks}>
                <a
                  href="https://github.com/inosaint/design-team-map/blob/main/CHANGELOG.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.aboutLink}
                >
                  Changelog
                </a>
                <a
                  href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.aboutLink}
                >
                  CC BY-NC-SA 4.0 License
                </a>
                <a
                  href="https://github.com/inosaint/design-team-map/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.aboutLink}
                >
                  Report a Bug
                </a>
              </div>

              <div className={styles.attributions}>
                <h4 className={styles.attributionsTitle}>Built with</h4>
                <ul className={styles.attributionsList}>
                  <li>
                    <a href="https://reactflow.dev" target="_blank" rel="noopener noreferrer">
                      React Flow
                    </a>
                    <span className={styles.attributionLicense}>MIT License</span>
                  </li>
                  <li>
                    <a href="https://zustand-demo.pmnd.rs" target="_blank" rel="noopener noreferrer">
                      Zustand
                    </a>
                    <span className={styles.attributionLicense}>MIT License</span>
                  </li>
                  <li>
                    <a href="https://html2canvas.hertzen.com" target="_blank" rel="noopener noreferrer">
                      html2canvas
                    </a>
                    <span className={styles.attributionLicense}>MIT License</span>
                  </li>
                </ul>
              </div>

              {onOpenQuickstart && (
                <div className={styles.quickstartSection}>
                  <div className={styles.divider} />
                  <h4 className={styles.attributionsTitle}>Getting Started</h4>
                  <p className={styles.quickstartDesc}>
                    New to Org Mapper? Use the quickstart wizard to generate a starter org chart.
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      toggleSettings();
                      onOpenQuickstart();
                    }}
                  >
                    Open Quick Start
                  </button>
                </div>
              )}

              <div className={styles.author}>
                Built by{' '}
                <a
                  href="https://x.com/kenneth"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @kenneth
                </a>
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
