// Core types for Design Team Map

export interface TeamMember {
  id: string;
  name: string;
  designerType: string;
  level: number;
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
  { level: 1, name: 'Designer I', color: '#FED7AA', minYearsFromPrevious: 0 },
  { level: 2, name: 'Designer II', color: '#FDBA74', minYearsFromPrevious: 1.5 },
  { level: 3, name: 'Designer III', color: '#FB923C', minYearsFromPrevious: 3 },
  { level: 4, name: 'Senior Designer', color: '#F97316', minYearsFromPrevious: 3 },
  { level: 5, name: 'Staff Designer', color: '#EA580C', minYearsFromPrevious: 4 },
  { level: 6, name: 'Design Lead', color: '#C2410C', minYearsFromPrevious: 4 },
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
};
