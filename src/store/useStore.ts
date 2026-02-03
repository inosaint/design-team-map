import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  TeamNode,
  TeamMember,
  PlannedHire,
  Vertical,
  Settings,
  NodePosition,
} from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { calculateAutoArrangePositions, wouldCreateCircularReference } from '../utils/calculations';
import { trackCardCreated, trackCardDeleted, trackCardConverted, trackDataCleared } from '../utils/analytics';
import { clearOnboardingState } from '../constants/onboarding';

interface TeamMapState {
  // Data
  nodes: TeamNode[];
  verticals: Vertical[];
  nodePositions: Map<string, { x: number; y: number }>;
  settings: Settings;

  // UI State
  selectedNodeId: string | null;
  isPanelOpen: boolean;
  isSettingsOpen: boolean;

  // Node Actions
  addTeamMember: (member: Omit<TeamMember, 'id' | 'isPlannedHire'>) => string;
  addPlannedHire: (hire: Omit<PlannedHire, 'id' | 'isPlannedHire'>) => string;
  updateNode: (id: string, updates: Partial<TeamNode>) => void;
  deleteNode: (id: string) => void;
  setNodeManager: (nodeId: string, managerId: string | null) => void;
  removeManager: (nodeId: string) => void;
  setNodeVertical: (nodeId: string, verticalId: string | undefined) => void;
  convertToHired: (plannedHireId: string, joiningDate?: string) => void;

  // Position Actions
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  updateNodePositions: (positions: NodePosition[]) => void;
  autoArrangeNodes: () => void;

  // Vertical Actions
  addVertical: (name: string, position: { x: number; y: number }) => string;
  updateVertical: (id: string, updates: Partial<Vertical>) => void;
  deleteVertical: (id: string) => void;

  // Settings Actions
  updateSettings: (settings: Partial<Settings>) => void;
  resetSettings: () => void;

  // UI Actions
  selectNode: (id: string | null) => void;
  openPanel: () => void;
  closePanel: () => void;
  toggleSettings: () => void;

  // Data Actions
  importData: (data: { nodes: TeamNode[]; verticals: Vertical[]; settings: Settings }) => void;
  exportData: () => { nodes: TeamNode[]; verticals: Vertical[]; settings: Settings };
  clearAll: () => void;
}

export const useStore = create<TeamMapState>()(
  persist(
    (set, get) => ({
      // Initial Data
      nodes: [],
      verticals: [],
      nodePositions: new Map(),
      settings: DEFAULT_SETTINGS,

      // Initial UI State
      selectedNodeId: null,
      isPanelOpen: false,
      isSettingsOpen: false,

      // Node Actions
      addTeamMember: (member) => {
        const id = uuidv4();
        const newMember: TeamMember = {
          ...member,
          id,
          isPlannedHire: false,
        };
        set((state) => ({
          nodes: [...state.nodes, newMember],
        }));
        trackCardCreated('team_member', { level: member.level, designerType: member.designerType });
        return id;
      },

      addPlannedHire: (hire) => {
        const id = uuidv4();
        const newHire: PlannedHire = {
          ...hire,
          id,
          isPlannedHire: true,
        };
        set((state) => ({
          nodes: [...state.nodes, newHire],
        }));
        trackCardCreated('planned_hire', { level: hire.level, designerType: hire.designerType });
        return id;
      },

      updateNode: (id, updates) => {
        set((state) => ({
          nodes: state.nodes.map((node): TeamNode =>
            node.id === id ? ({ ...node, ...updates } as TeamNode) : node
          ),
        }));
      },

      deleteNode: (id) => {
        const nodeToDelete = get().nodes.find((node) => node.id === id);
        set((state) => {
          // Also remove this node as manager from any reports
          const updatedNodes: TeamNode[] = state.nodes
            .filter((node) => node.id !== id)
            .map((node): TeamNode => {
              if (node.managerId === id) {
                return { ...node, managerId: undefined } as TeamNode;
              }
              return node;
            });
          const newPositions = new Map(state.nodePositions);
          newPositions.delete(id);
          return {
            nodes: updatedNodes,
            nodePositions: newPositions,
            selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
            isPanelOpen: state.selectedNodeId === id ? false : state.isPanelOpen,
          };
        });
        if (nodeToDelete) {
          trackCardDeleted(nodeToDelete.isPlannedHire);
        }
      },

      setNodeManager: (nodeId, managerId) => {
        // Prevent circular references
        if (managerId && wouldCreateCircularReference(nodeId, managerId, get().nodes)) {
          console.warn('Cannot set manager: would create circular reference');
          return;
        }
        set((state) => ({
          nodes: state.nodes.map((node): TeamNode =>
            node.id === nodeId ? ({ ...node, managerId } as TeamNode) : node
          ),
        }));
      },

      removeManager: (nodeId) => {
        set((state) => ({
          nodes: state.nodes.map((node): TeamNode =>
            node.id === nodeId ? ({ ...node, managerId: undefined } as TeamNode) : node
          ),
        }));
      },

      setNodeVertical: (nodeId, verticalId) => {
        set((state) => ({
          nodes: state.nodes.map((node): TeamNode =>
            node.id === nodeId ? ({ ...node, verticalId } as TeamNode) : node
          ),
        }));
      },

      convertToHired: (plannedHireId, joiningDate) => {
        set((state) => ({
          nodes: state.nodes.map((node): TeamNode => {
            if (node.id === plannedHireId && node.isPlannedHire) {
              const plannedNode = node as PlannedHire;
              const newMember: TeamMember = {
                id: plannedNode.id,
                name: plannedNode.name,
                designerType: plannedNode.designerType,
                level: plannedNode.level,
                yearsOfExperience: plannedNode.yearsOfExperience || 0,
                joiningDate: joiningDate || new Date().toISOString().split('T')[0],
                managerId: plannedNode.managerId,
                verticalId: plannedNode.verticalId,
                isPlannedHire: false as const,
              };
              return newMember;
            }
            return node;
          }),
        }));
        trackCardConverted();
      },

      // Position Actions
      updateNodePosition: (id, position) => {
        set((state) => {
          const newPositions = new Map(state.nodePositions);
          newPositions.set(id, position);
          return { nodePositions: newPositions };
        });
      },

      updateNodePositions: (positions) => {
        set((state) => {
          const newPositions = new Map(state.nodePositions);
          positions.forEach(({ id, x, y }) => {
            newPositions.set(id, { x, y });
          });
          return { nodePositions: newPositions };
        });
      },

      autoArrangeNodes: () => {
        const state = get();
        const newPositions = calculateAutoArrangePositions(state.nodes);
        set({ nodePositions: newPositions });
      },

      // Vertical Actions
      addVertical: (name, position) => {
        const id = uuidv4();
        const newVertical: Vertical = {
          id,
          name,
          position,
        };
        set((state) => ({
          verticals: [...state.verticals, newVertical],
        }));
        return id;
      },

      updateVertical: (id, updates) => {
        set((state) => ({
          verticals: state.verticals.map((v) =>
            v.id === id ? { ...v, ...updates } : v
          ),
        }));
      },

      deleteVertical: (id) => {
        set((state) => ({
          verticals: state.verticals.filter((v) => v.id !== id),
          // Remove vertical assignment from nodes
          nodes: state.nodes.map((node) =>
            node.verticalId === id ? { ...node, verticalId: undefined } : node
          ),
        }));
      },

      // Settings Actions
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));
      },

      resetSettings: () => {
        set({ settings: DEFAULT_SETTINGS });
      },

      // UI Actions
      selectNode: (id) => {
        set({
          selectedNodeId: id,
          isPanelOpen: id !== null,
        });
      },

      openPanel: () => {
        set({ isPanelOpen: true });
      },

      closePanel: () => {
        set({ isPanelOpen: false, selectedNodeId: null });
      },

      toggleSettings: () => {
        set((state) => ({ isSettingsOpen: !state.isSettingsOpen }));
      },

      // Data Actions
      importData: (data) => {
        set({
          nodes: data.nodes,
          verticals: data.verticals,
          settings: { ...DEFAULT_SETTINGS, ...data.settings },
        });
      },

      exportData: () => {
        const state = get();
        return {
          nodes: state.nodes,
          verticals: state.verticals,
          settings: state.settings,
        };
      },

      clearAll: () => {
        set({
          nodes: [],
          verticals: [],
          nodePositions: new Map(),
          selectedNodeId: null,
          isPanelOpen: false,
        });
        clearOnboardingState();
        trackDataCleared();
      },
    }),
    {
      name: 'design-team-map-storage',
      partialize: (state) => ({
        nodes: state.nodes,
        verticals: state.verticals,
        nodePositions: Array.from(state.nodePositions.entries()),
        settings: state.settings,
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as any;
        return {
          ...current,
          ...persistedState,
          nodePositions: new Map(persistedState?.nodePositions || []),
        };
      },
    }
  )
);

// Selector hooks for computed values
export const useReportCounts = () => {
  const nodes = useStore((state) => state.nodes);
  const counts = new Map<string, number>();

  nodes.forEach((node) => {
    if (node.managerId) {
      counts.set(node.managerId, (counts.get(node.managerId) || 0) + 1);
    }
  });

  return counts;
};

export const useNodeById = (id: string | null) => {
  return useStore((state) => (id ? state.nodes.find((n) => n.id === id) : null));
};

export const useSelectedNode = () => {
  const selectedNodeId = useStore((state) => state.selectedNodeId);
  return useNodeById(selectedNodeId);
};
