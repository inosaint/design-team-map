// Core types for Design Team Map

// Career track type - IC (Individual Contributor) or Manager
export type CareerTrack = 'ic' | 'manager';

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
  level: number;
  name: string;
  color: string;
  minYearsFromPrevious: number; // Min years needed to reach this level from previous
  track?: CareerTrack; // undefined = shared level (before split), 'ic' or 'manager' = track-specific
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
  companyName?: string;
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
  // Shared levels (before split)
  { level: 1, name: 'Designer I', color: '#FED7AA', minYearsFromPrevious: 0 },
  { level: 2, name: 'Designer II', color: '#FDBA74', minYearsFromPrevious: 1.5 },
  { level: 3, name: 'Designer III', color: '#FB923C', minYearsFromPrevious: 3 },
  // IC Track (from level 4)
  { level: 4, name: 'Senior Designer', color: '#F97316', minYearsFromPrevious: 3, track: 'ic' },
  { level: 5, name: 'Staff Designer', color: '#EA580C', minYearsFromPrevious: 4, track: 'ic' },
  { level: 6, name: 'Principal Designer', color: '#C2410C', minYearsFromPrevious: 4, track: 'ic' },
  // Manager Track (from level 4)
  { level: 4, name: 'Design Manager', color: '#86EFAC', minYearsFromPrevious: 3, track: 'manager' },
  { level: 5, name: 'Senior Design Manager', color: '#4ADE80', minYearsFromPrevious: 4, track: 'manager' },
  { level: 6, name: 'Design Director', color: '#22C55E', minYearsFromPrevious: 4, track: 'manager' },
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
};
