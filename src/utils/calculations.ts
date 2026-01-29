import type { TeamNode, Settings, LevelConfig, CareerTrack } from '../types';

/**
 * Calculate the number of direct reports for each manager
 */
export function calculateReportCounts(nodes: TeamNode[]): Map<string, number> {
  const counts = new Map<string, number>();

  nodes.forEach((node) => {
    if (node.managerId) {
      counts.set(node.managerId, (counts.get(node.managerId) || 0) + 1);
    }
  });

  return counts;
}

/**
 * Check if a manager has exceeded the span of control threshold
 */
export function isOverCapacity(
  managerId: string,
  reportCounts: Map<string, number>,
  threshold: number
): boolean {
  const count = reportCounts.get(managerId) || 0;
  return count > threshold;
}

/**
 * Get the level configuration for a specific level and track
 * For levels below trackSplitLevel, track is ignored
 * For levels at or above trackSplitLevel, track should match if available
 * Falls back gracefully when exact matches aren't found
 */
export function getLevelConfig(
  level: number,
  levels: LevelConfig[],
  track?: CareerTrack,
  trackSplitLevel?: number
): LevelConfig | undefined {
  // First, find all levels matching this number
  const matchingLevels = levels.filter((l) => l.level === level);

  if (matchingLevels.length === 0) {
    return undefined;
  }

  // If only one match, return it regardless of track
  if (matchingLevels.length === 1) {
    return matchingLevels[0];
  }

  // Try to find exact match (level + track)
  if (track) {
    const exactMatch = matchingLevels.find((l) => l.track === track);
    if (exactMatch) return exactMatch;
  }

  // Look for shared level (no track)
  const sharedMatch = matchingLevels.find((l) => !l.track);
  if (sharedMatch) return sharedMatch;

  // For levels at or above split, try IC track first if no track specified
  if (trackSplitLevel && level >= trackSplitLevel && !track) {
    const icMatch = matchingLevels.find((l) => l.track === 'ic');
    if (icMatch) return icMatch;
  }

  // Fallback: return first matching level
  return matchingLevels[0];
}

/**
 * Get all level configs for a track (shared levels + track-specific levels)
 */
export function getLevelsForTrack(
  levels: LevelConfig[],
  track: CareerTrack,
  trackSplitLevel: number
): LevelConfig[] {
  return levels.filter((l) => {
    if (l.level < trackSplitLevel) {
      return !l.track; // Shared levels
    }
    return l.track === track;
  });
}

/**
 * Get available levels for selection (grouped by track for UI)
 * Now handles levels without track assignment more gracefully
 */
export function getAvailableLevels(settings: Settings): {
  shared: LevelConfig[];
  ic: LevelConfig[];
  manager: LevelConfig[];
} {
  // Shared levels: no track OR levels below trackSplitLevel without track
  const shared = settings.levels.filter(
    (l) => !l.track || l.level < settings.trackSplitLevel
  );
  const ic = settings.levels.filter((l) => l.track === 'ic');
  const manager = settings.levels.filter((l) => l.track === 'manager');

  // If there are no track-specific levels, include all levels in shared
  if (ic.length === 0 && manager.length === 0) {
    return { shared: settings.levels, ic: [], manager: [] };
  }

  return { shared, ic, manager };
}

/**
 * Calculate if a team member is eligible for promotion
 * Returns: { eligible: boolean, yearsUntilEligible: number }
 */
export function calculatePromotionEligibility(
  node: TeamNode,
  settings: Settings
): { eligible: boolean; yearsUntilEligible: number } {
  if (node.isPlannedHire) {
    return { eligible: false, yearsUntilEligible: 0 };
  }

  const currentLevel = node.level;
  const nextLevel = currentLevel + 1;
  const track = node.track;

  // Get next level config based on track
  const nextLevelConfig = getLevelConfig(
    nextLevel,
    settings.levels,
    track,
    settings.trackSplitLevel
  );

  // No next level exists
  if (!nextLevelConfig) {
    return { eligible: false, yearsUntilEligible: 0 };
  }

  const yearsOfExperience = node.yearsOfExperience || 0;

  // Calculate total years needed for current level
  let totalYearsNeeded = 0;
  for (let i = 1; i <= currentLevel; i++) {
    const levelConfig = getLevelConfig(
      i,
      settings.levels,
      i >= settings.trackSplitLevel ? track : undefined,
      settings.trackSplitLevel
    );
    if (levelConfig) {
      totalYearsNeeded += levelConfig.minYearsFromPrevious;
    }
  }

  // Add years needed for next level
  totalYearsNeeded += nextLevelConfig.minYearsFromPrevious;

  const yearsUntilEligible = Math.max(0, totalYearsNeeded - yearsOfExperience);

  return {
    eligible: yearsUntilEligible === 0,
    yearsUntilEligible,
  };
}

/**
 * Get the designer type abbreviation
 */
export function getDesignerTypeAbbreviation(
  typeId: string,
  settings: Settings
): string {
  const type = settings.designerTypes.find((t) => t.id === typeId);
  return type?.abbreviation || typeId.toUpperCase().slice(0, 2);
}

/**
 * Get the designer type name
 */
export function getDesignerTypeName(
  typeId: string,
  settings: Settings
): string {
  const type = settings.designerTypes.find((t) => t.id === typeId);
  return type?.name || typeId;
}

/**
 * Get the level name for a node
 */
export function getLevelName(
  level: number,
  settings: Settings,
  track?: CareerTrack
): string {
  const levelConfig = getLevelConfig(
    level,
    settings.levels,
    track,
    settings.trackSplitLevel
  );
  return levelConfig?.name || `Level ${level}`;
}

/**
 * Get the level color for a node
 */
export function getLevelColor(
  level: number,
  settings: Settings,
  track?: CareerTrack
): string {
  const levelConfig = getLevelConfig(
    level,
    settings.levels,
    track,
    settings.trackSplitLevel
  );
  return levelConfig?.color || '#e4e4e7';
}

/**
 * Check if a level requires track selection
 */
export function levelRequiresTrack(level: number, settings: Settings): boolean {
  return level >= settings.trackSplitLevel;
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Parse tentative date (Q1 2025, March 2025, etc.)
 */
export function parseTentativeDate(dateString: string | undefined): string {
  if (!dateString) return 'TBD';
  return dateString;
}

/**
 * Get all nodes that report to a specific manager
 */
export function getDirectReports(
  managerId: string,
  nodes: TeamNode[]
): TeamNode[] {
  return nodes.filter((node) => node.managerId === managerId);
}

/**
 * Get the full reporting chain up to the root
 */
export function getReportingChain(
  nodeId: string,
  nodes: TeamNode[]
): TeamNode[] {
  const chain: TeamNode[] = [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  let currentId: string | null | undefined = nodeId;

  while (currentId) {
    const node = nodeMap.get(currentId);
    if (!node) break;
    chain.push(node);
    currentId = node.managerId;
  }

  return chain;
}

/**
 * Check if setting a manager would create a circular reference
 */
export function wouldCreateCircularReference(
  nodeId: string,
  proposedManagerId: string,
  nodes: TeamNode[]
): boolean {
  const chain = getReportingChain(proposedManagerId, nodes);
  return chain.some((node) => node.id === nodeId);
}
