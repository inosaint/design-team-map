import type { TeamNode, Settings, LevelConfig } from '../types';

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
 * Get the level configuration for a specific level
 */
export function getLevelConfig(
  level: number,
  levels: LevelConfig[]
): LevelConfig | undefined {
  return levels.find((l) => l.level === level);
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
  const nextLevelConfig = getLevelConfig(nextLevel, settings.levels);

  // No next level exists
  if (!nextLevelConfig) {
    return { eligible: false, yearsUntilEligible: 0 };
  }

  const yearsOfExperience = node.yearsOfExperience || 0;

  // Calculate total years needed for current level
  let totalYearsNeeded = 0;
  for (let i = 1; i <= currentLevel; i++) {
    const levelConfig = getLevelConfig(i, settings.levels);
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
 * Get the level name
 */
export function getLevelName(level: number, settings: Settings): string {
  const levelConfig = getLevelConfig(level, settings.levels);
  return levelConfig?.name || `Level ${level}`;
}

/**
 * Get the level color
 */
export function getLevelColor(level: number, settings: Settings): string {
  const levelConfig = getLevelConfig(level, settings.levels);
  return levelConfig?.color || '#e4e4e7';
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
