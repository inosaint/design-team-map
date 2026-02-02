// Core types for Org Mapper

// Career track type - IC (Individual Contributor) or Manager
export type CareerTrack = 'ic' | 'manager';

export type Gender = 'male' | 'female' | 'non-binary' | 'other' | 'prefer-not-to-say';

export interface TeamMember {
  id: string;
  name: string;
  designerType: string;
  level: number;
  track?: CareerTrack; // Only relevant for levels >= trackSplitLevel
  yearsOfExperience: number;
  joiningDate?: string; // ISO date string, optional
  managerId?: string | null; // null for top-level, undefined for unassigned
  verticalId?: string;
  notes?: string; // Personal notes about the team member
  gender?: Gender; // Optional, only shown if enabled in settings
  isPlannedHire: false;
}

export interface PlannedHire {
  id: string;
  name: string; // Can be "TBD" or role name
  designerType: string;
  level: number;
  track?: CareerTrack; // Only relevant for levels >= trackSplitLevel
  yearsOfExperience?: number; // Optional for planned hires
  tentativeDate?: string; // "Q1 2025", "March 2025", etc.
  managerId?: string | null;
  verticalId?: string;
  notes?: string; // Notes about the planned hire
  gender?: Gender; // Optional, only shown if enabled in settings
  isPlannedHire: true;
}

export type TeamNode = TeamMember | PlannedHire;

export interface Vertical {
  id: string;
  name: string;
  color?: string;
  position: { x: number; y: number };
}

export interface LevelConfig {
  id: string; // Unique identifier for this level entry (e.g., 'level-4-ic', 'level-6-head')
  level: number;
  name: string;
  color: string;
  minYearsFromPrevious: number; // Min years needed to reach this level from previous
  track?: CareerTrack; // undefined = shared level (before split or head), 'ic' or 'manager' = track-specific
  isMaxLevel?: boolean; // True for head of design level (both tracks converge)
}

export interface DesignerTypeConfig {
  id: string;
  name: string;
  abbreviation: string;
}

export interface Settings {
  levels: LevelConfig[];
  designerTypes: DesignerTypeConfig[];
  spanOfControlThreshold: number; // Default: 6
  trackSplitLevel: number; // Level at which IC/Manager tracks diverge (default: 4)
  teamName?: string; // Name of the org/team for the map title
  // Advanced options
  showGender?: boolean;
  showMinimap?: boolean;
}

export interface NodePosition {
  id: string;
  x: number;
  y: number;
}

// For React Flow - needs index signature for compatibility
export interface FlowNodeData {
  teamNode: TeamNode;
  reportCount: number;
  isOverCapacity: boolean;
  promotionEligible: boolean;
  yearsUntilEligible?: number;
  [key: string]: unknown;
}

export interface FlowEdgeData {
  isOverCapacity: boolean;
  [key: string]: unknown;
}

// Default configurations
export const DEFAULT_LEVELS: LevelConfig[] = [
  // Shared levels (before split at level 4)
  { id: 'level-1', level: 1, name: 'Designer I', color: '#FED7AA', minYearsFromPrevious: 0 },
  { id: 'level-2', level: 2, name: 'Designer II', color: '#FDBA74', minYearsFromPrevious: 1.5 },
  { id: 'level-3', level: 3, name: 'Designer III', color: '#FB923C', minYearsFromPrevious: 3 },
  // IC Track (from level 4)
  { id: 'level-4-ic', level: 4, name: 'Senior Designer', color: '#F97316', minYearsFromPrevious: 3, track: 'ic' },
  { id: 'level-5-ic', level: 5, name: 'Staff Designer', color: '#EA580C', minYearsFromPrevious: 4, track: 'ic' },
  // Manager Track (from level 4)
  { id: 'level-4-manager', level: 4, name: 'Design Manager', color: '#86EFAC', minYearsFromPrevious: 3, track: 'manager' },
  { id: 'level-5-manager', level: 5, name: 'Senior Design Manager', color: '#4ADE80', minYearsFromPrevious: 4, track: 'manager' },
  // Head of Design (max level - both tracks converge)
  { id: 'level-6-head', level: 6, name: 'Head of Design', color: '#22C55E', minYearsFromPrevious: 4, isMaxLevel: true },
];

export const DEFAULT_DESIGNER_TYPES: DesignerTypeConfig[] = [
  { id: 'ux', name: 'UX Designer', abbreviation: 'UX' },
  { id: 'ui', name: 'UI Designer', abbreviation: 'UI' },
  { id: 'product', name: 'Product Designer', abbreviation: 'PD' },
  { id: 'visual', name: 'Visual Designer', abbreviation: 'VD' },
  { id: 'research', name: 'UX Researcher', abbreviation: 'UXR' },
  { id: 'content', name: 'Content Designer', abbreviation: 'CD' },
  { id: 'motion', name: 'Motion Designer', abbreviation: 'MD' },
];

export const DEFAULT_SETTINGS: Settings = {
  levels: DEFAULT_LEVELS,
  designerTypes: DEFAULT_DESIGNER_TYPES,
  spanOfControlThreshold: 6,
  trackSplitLevel: 4,
  teamName: 'My Team',
  showGender: false,
  showMinimap: false,
};
