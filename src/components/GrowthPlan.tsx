import { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useStore } from '../store/useStore';
import type { GrowthPlanItem, GrowthPlanStatus, MeetingNote, TeamMember } from '../types';
import { getDesignerTypeName, getLevelName } from '../utils/calculations';
import styles from './GrowthPlan.module.css';

const today = () => new Date().toISOString().split('T')[0];
const growthColumns: Array<{ status: GrowthPlanStatus; title: string }> = [
  { status: 'planned', title: 'Planned' },
  { status: 'doing', title: 'Doing' },
  { status: 'completed', title: 'Completed' },
];

const getGrowthItems = (member: TeamMember): GrowthPlanItem[] => {
  if (member.growthPlanItems?.length) {
    return member.growthPlanItems;
  }

  if (member.growthPlan?.trim()) {
    return [{
      id: 'legacy-growth-plan',
      status: 'planned',
      content: member.growthPlan.trim(),
    }];
  }

  return [];
};

export default function GrowthPlan() {
  const { nodes, settings, updateNode } = useStore();
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [draftCards, setDraftCards] = useState<Record<GrowthPlanStatus, string>>({
    planned: '',
    doing: '',
    completed: '',
  });
  const [draftNote, setDraftNote] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const teamMembers = useMemo(
    () => nodes.filter((node): node is TeamMember => node.isPlannedHire === false),
    [nodes]
  );

  const selectedMember = teamMembers.find((member) => member.id === selectedMemberId) || null;

  useEffect(() => {
    if (!isEditingName) return;
    nameInputRef.current?.focus();
    nameInputRef.current?.select();
  }, [isEditingName]);

  const handleSelectMember = (id: string) => {
    const member = teamMembers.find((teamMember) => teamMember.id === id);
    setSelectedMemberId((currentId) => (currentId === id ? null : id));
    setDraftName(member?.name || '');
    setDraftNote('');
    setSelectedTaskId(null);
    setIsEditingName(false);
  };

  const handleNameSave = () => {
    if (!selectedMember) return;
    const trimmedName = draftName.trim();
    if (trimmedName) {
      updateNode(selectedMember.id, { name: trimmedName });
    } else {
      setDraftName(selectedMember.name);
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      setDraftName(selectedMember?.name || '');
      setIsEditingName(false);
    }
  };

  const updateGrowthItems = (items: GrowthPlanItem[]) => {
    if (!selectedMember) return;
    updateNode(selectedMember.id, {
      growthPlanItems: items,
      growthPlan: undefined,
    });
  };

  const handleDraftCardChange = (status: GrowthPlanStatus, value: string) => {
    setDraftCards((current) => ({ ...current, [status]: value }));
  };

  const handleAddGrowthCard = (status: GrowthPlanStatus) => {
    if (!selectedMember) return;
    const content = draftCards[status].trim();
    if (!content) return;

    updateGrowthItems([
      ...getGrowthItems(selectedMember),
      {
        id: uuidv4(),
        status,
        content,
      },
    ]);
    setDraftCards((current) => ({ ...current, [status]: '' }));
  };

  const handleMoveGrowthCard = (itemId: string, status: GrowthPlanStatus) => {
    if (!selectedMember) return;
    updateGrowthItems(
      getGrowthItems(selectedMember).map((item) =>
        item.id === itemId ? { ...item, status } : item
      )
    );
  };

  const handleUpdateGrowthCard = (itemId: string, updates: Partial<GrowthPlanItem>) => {
    if (!selectedMember) return;
    updateGrowthItems(
      getGrowthItems(selectedMember).map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    );
  };

  const handleDeleteGrowthCard = (itemId: string) => {
    if (!selectedMember) return;
    if (selectedTaskId === itemId) {
      setSelectedTaskId(null);
    }
    updateGrowthItems(getGrowthItems(selectedMember).filter((item) => item.id !== itemId));
  };

  const handleAddNote = () => {
    if (!selectedMember) return;
    const content = draftNote.trim();
    if (!content) return;

    const note: MeetingNote = {
      id: uuidv4(),
      date: today(),
      content,
    };

    updateNode(selectedMember.id, {
      meetingNotes: [note, ...(selectedMember.meetingNotes || [])],
    });
    setDraftNote('');
  };

  const handleDeleteNote = (noteId: string) => {
    if (!selectedMember) return;
    updateNode(selectedMember.id, {
      meetingNotes: selectedMember.meetingNotes?.filter((note) => note.id !== noteId) || [],
    });
  };

  const growthItems = selectedMember ? getGrowthItems(selectedMember) : [];
  const selectedTask = growthItems.find((item) => item.id === selectedTaskId) || null;

  return (
    <div className={styles.growthPlan}>
      <aside className={styles.roster} aria-label="Team members">
        {teamMembers.length === 0 ? (
          <div className={styles.emptyRoster}>
            Add team members on the chart to start growth planning.
          </div>
        ) : (
          <div className={styles.memberList}>
            {teamMembers.map((member) => {
              const isSelected = member.id === selectedMemberId;
              return (
                <button
                  key={member.id}
                  type="button"
                  className={`${styles.memberItem} ${isSelected ? styles.selected : ''}`}
                  onClick={() => handleSelectMember(member.id)}
                  aria-pressed={isSelected}
                >
                  <span className={styles.memberRow}>
                    <span className={styles.memberName}>{member.name}</span>
                    <span className={styles.memberMeta}>
                      {getLevelName(member.level, settings, member.track)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </aside>

      <section className={styles.detail} aria-label="Growth plan details">
        {!selectedMember ? (
          <div className={styles.emptyDetail}>
            <h2>Select a team member</h2>
            <p>Open someone from the roster to define their growth plan and capture meeting notes.</p>
          </div>
        ) : (
          <div className={styles.editor}>
            <header className={styles.editorHeader}>
              <div className={styles.identityBlock}>
                {isEditingName ? (
                  <input
                    ref={nameInputRef}
                    className={styles.nameInput}
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={handleNameSave}
                    onKeyDown={handleNameKeyDown}
                  />
                ) : (
                  <button
                    type="button"
                    className={styles.nameButton}
                    onClick={() => {
                      setDraftName(selectedMember.name);
                      setIsEditingName(true);
                    }}
                    title="Click to edit name"
                  >
                    {selectedMember.name}
                  </button>
                )}
                <div className={styles.roleLine}>
                  <span>{getDesignerTypeName(selectedMember.designerType, settings)}</span>
                  <span>{getLevelName(selectedMember.level, settings, selectedMember.track)}</span>
                </div>
              </div>
            </header>

            <div className={styles.boardSection}>
              <div className={styles.boardHeader}>
                <h3>Growth plan</h3>
              </div>
              <div className={styles.board} aria-label="Growth plan board">
                {growthColumns.map((column) => {
                  const columnItems = growthItems.filter((item) => item.status === column.status);
                  return (
                    <section key={column.status} className={styles.boardColumn}>
                      <div className={styles.columnHeader}>
                        <h4>{column.title}</h4>
                        <span>{columnItems.length}</span>
                      </div>

                      <div className={styles.cardList}>
                        {columnItems.map((item) => (
                          <article
                            key={item.id}
                            className={`${styles.growthCard} ${selectedTaskId === item.id ? styles.selectedCard : ''}`}
                            onClick={() => setSelectedTaskId(item.id)}
                          >
                            <p>{item.content}</p>
                            <div className={styles.cardActions}>
                              <select
                                className={styles.statusSelect}
                                value={item.status}
                                onChange={(e) =>
                                  handleMoveGrowthCard(item.id, e.target.value as GrowthPlanStatus)
                                }
                                onClick={(e) => e.stopPropagation()}
                                aria-label="Move growth item"
                              >
                                {growthColumns.map((targetColumn) => (
                                  <option key={targetColumn.status} value={targetColumn.status}>
                                    {targetColumn.title}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                className={styles.deleteNote}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteGrowthCard(item.id);
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>

                      <div className={styles.inlineComposer}>
                        <textarea
                          className={`input ${styles.cardInput}`}
                          value={draftCards[column.status]}
                          onChange={(e) => handleDraftCardChange(column.status, e.target.value)}
                          placeholder={`Add ${column.title.toLowerCase()} item`}
                          rows={3}
                        />
                        <div className={styles.composerActions}>
                          <button
                            className="btn btn-secondary btn-sm"
                            type="button"
                            onClick={() => handleAddGrowthCard(column.status)}
                            disabled={!draftCards[column.status].trim()}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>

            <div className={styles.notesSection}>
              <div className={styles.notesHeader}>
                <h3>Meeting notes</h3>
                <span>{selectedMember.meetingNotes?.length || 0}</span>
              </div>

              <div className={styles.noteComposer}>
                <textarea
                  className={`input ${styles.noteInput}`}
                  value={draftNote}
                  onChange={(e) => setDraftNote(e.target.value)}
                  placeholder="Add notes from a growth conversation or 1:1."
                  rows={4}
                />
                <div className={styles.composerActions}>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={handleAddNote}
                    disabled={!draftNote.trim()}
                  >
                    Add Note
                  </button>
                </div>
              </div>

              <div className={styles.notesList}>
                {(selectedMember.meetingNotes || []).map((note) => (
                  <article key={note.id} className={styles.note}>
                    <div className={styles.noteHeader}>
                      <time dateTime={note.date}>
                        {new Date(`${note.date}T00:00:00`).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                      <button
                        type="button"
                        className={styles.deleteNote}
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        Delete
                      </button>
                    </div>
                    <p>{note.content}</p>
                  </article>
                ))}

                {(!selectedMember.meetingNotes || selectedMember.meetingNotes.length === 0) && (
                  <div className={styles.emptyNotes}>No meeting notes yet.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {selectedTask && (
        <aside className={styles.taskPanel} aria-label="Growth task details">
          <div className={styles.taskPanelHeader}>
            <h3>Task details</h3>
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={() => setSelectedTaskId(null)}
            >
              ×
            </button>
          </div>

          <div className={styles.taskPanelContent}>
            <div className={styles.taskField}>
              <label className="label" htmlFor="task-title">
                Task
              </label>
              <textarea
                id="task-title"
                className={`input ${styles.taskTitleInput}`}
                value={selectedTask.content}
                onChange={(e) => handleUpdateGrowthCard(selectedTask.id, { content: e.target.value })}
                rows={4}
              />
            </div>

            <div className={styles.taskField}>
              <label className="label" htmlFor="task-status">
                Status
              </label>
              <select
                id="task-status"
                className="select"
                value={selectedTask.status}
                onChange={(e) =>
                  handleUpdateGrowthCard(selectedTask.id, {
                    status: e.target.value as GrowthPlanStatus,
                  })
                }
              >
                {growthColumns.map((column) => (
                  <option key={column.status} value={column.status}>
                    {column.title}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.taskField}>
              <label className="label" htmlFor="task-details">
                Additional information
              </label>
              <textarea
                id="task-details"
                className={`input ${styles.taskDetailsInput}`}
                value={selectedTask.details || ''}
                onChange={(e) => handleUpdateGrowthCard(selectedTask.id, { details: e.target.value })}
                placeholder="Add context, success criteria, links, or follow-up notes for this task."
                rows={8}
              />
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
