import type { TeamNode, Settings, LevelConfig, CareerTrack } from '../types';

/**
 * Generate a unique level config ID
 */
export function generateLevelId(level: number, track?: CareerTrack, isMaxLevel?: boolean): string {
  if (isMaxLevel) {
    return `level-${level}-head`;
  }
  if (track) {
    return `level-${level}-${track}`;
  }
  return `level-${level}`;
}

/**
 * Get level config by ID
 */
export function getLevelConfigById(id: string, levels: LevelConfig[]): LevelConfig | undefined {
  return levels.find(l => l.id === id);
}

/**
 * Get the level config ID for a node's level and track
 */
export function getLevelConfigIdForNode(level: number, track: CareerTrack | undefined, settings: Settings): string {
  // Check if this is the max level (head of design)
  const maxLevel = Math.max(...settings.levels.map(l => l.level));
  const headLevel = settings.levels.find(l => l.isMaxLevel && l.level === level);

  if (headLevel) {
    return headLevel.id;
  }

  // Check if level requires track
  if (level >= settings.trackSplitLevel && level < maxLevel) {
    return generateLevelId(level, track || 'ic');
  }

  return generateLevelId(level);
}

/**
 * Regenerate levels when split level changes
 * Preserves level names and settings where possible
 */
export function regenerateLevelsForSplitLevel(
  currentLevels: LevelConfig[],
  newSplitLevel: number,
  maxLevel?: number
): LevelConfig[] {
  // Determine max level from current levels if not specified
  const currentMaxLevel = maxLevel || Math.max(...currentLevels.map(l => l.level));

  // Get head of design config (always exists at max level)
  const headConfig = currentLevels.find(l => l.isMaxLevel);
  const headName = headConfig?.name || 'Head of Design';
  const headColor = headConfig?.color || '#22C55E';
  const headYears = headConfig?.minYearsFromPrevious || 4;

  const newLevels: LevelConfig[] = [];

  // Default colors for IC and Manager tracks
  const icColors = ['#F97316', '#EA580C', '#DC2626', '#B91C1C', '#991B1B'];
  const mgrColors = ['#86EFAC', '#4ADE80', '#22C55E', '#16A34A', '#15803D'];
  const sharedColors = ['#FED7AA', '#FDBA74', '#FB923C', '#F97316', '#EA580C'];

  // Generate shared levels (1 to splitLevel - 1)
  for (let level = 1; level < newSplitLevel; level++) {
    // Try to find existing config for this level
    const existing = currentLevels.find(l => l.level === level && !l.track && !l.isMaxLevel);

    newLevels.push({
      id: generateLevelId(level),
      level,
      name: existing?.name || `Designer ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][level - 1] || level}`,
      color: existing?.color || sharedColors[level - 1] || '#e4e4e7',
      minYearsFromPrevious: existing?.minYearsFromPrevious ?? (level === 1 ? 0 : 1.5),
    });
  }

  // Generate IC and Manager track levels (splitLevel to maxLevel - 1)
  for (let level = newSplitLevel; level < currentMaxLevel; level++) {
    const levelIndex = level - newSplitLevel;

    // IC track
    const existingIc = currentLevels.find(l => l.level === level && l.track === 'ic');
    newLevels.push({
      id: generateLevelId(level, 'ic'),
      level,
      name: existingIc?.name || getDefaultIcName(level, newSplitLevel),
      color: existingIc?.color || icColors[levelIndex] || '#EA580C',
      minYearsFromPrevious: existingIc?.minYearsFromPrevious ?? 3,
      track: 'ic',
    });

    // Manager track
    const existingMgr = currentLevels.find(l => l.level === level && l.track === 'manager');
    newLevels.push({
      id: generateLevelId(level, 'manager'),
      level,
      name: existingMgr?.name || getDefaultManagerName(level, newSplitLevel),
      color: existingMgr?.color || mgrColors[levelIndex] || '#4ADE80',
      minYearsFromPrevious: existingMgr?.minYearsFromPrevious ?? 3,
      track: 'manager',
    });
  }

  // Add head of design (max level, no track)
  newLevels.push({
    id: generateLevelId(currentMaxLevel, undefined, true),
    level: currentMaxLevel,
    name: headName,
    color: headColor,
    minYearsFromPrevious: headYears,
    isMaxLevel: true,
  });

  return newLevels;
}

/**
 * Get default IC track name for a level
 */
function getDefaultIcName(level: number, splitLevel: number): string {
  const icTitles = ['Senior Designer', 'Staff Designer', 'Principal Designer', 'Distinguished Designer'];
  const index = level - splitLevel;
  return icTitles[index] || `IC Level ${level}`;
}

/**
 * Get default Manager track name for a level
 */
function getDefaultManagerName(level: number, splitLevel: number): string {
  const mgrTitles = ['Design Manager', 'Senior Design Manager', 'Design Director', 'VP of Design'];
  const index = level - splitLevel;
  return mgrTitles[index] || `Manager Level ${level}`;
}

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
  head: LevelConfig | null;
} {
  // Shared levels: no track and not max level
  const shared = settings.levels.filter(
    (l) => !l.track && !l.isMaxLevel
  );
  const ic = settings.levels.filter((l) => l.track === 'ic');
  const manager = settings.levels.filter((l) => l.track === 'manager');
  const head = settings.levels.find((l) => l.isMaxLevel) || null;

  return { shared, ic, manager, head };
}

/**
 * Get all levels as a flat list for simple dropdown rendering
 * Orders by: shared levels, then paired IC/Manager levels by level number, then head
 */
export function getAvailableLevelsFlat(settings: Settings): LevelConfig[] {
  const { shared, ic, manager, head } = getAvailableLevels(settings);

  // Sort shared by level
  const sortedShared = [...shared].sort((a, b) => a.level - b.level);

  // Interleave IC and Manager by level number
  const splitLevels: LevelConfig[] = [];
  const maxSplitLevel = Math.max(
    ...ic.map(l => l.level),
    ...manager.map(l => l.level),
    0
  );

  for (let level = settings.trackSplitLevel; level <= maxSplitLevel; level++) {
    const icLevel = ic.find(l => l.level === level);
    const mgrLevel = manager.find(l => l.level === level);
    if (icLevel) splitLevels.push(icLevel);
    if (mgrLevel) splitLevels.push(mgrLevel);
  }

  // Combine all
  const result = [...sortedShared, ...splitLevels];
  if (head) result.push(head);

  return result;
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

/**
 * Auto-arrange nodes in a hierarchical tree layout
 * Returns a map of node IDs to their new positions
 */
export function calculateAutoArrangePositions(
  nodes: TeamNode[]
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  if (nodes.length === 0) return positions;

  // Configuration
  const nodeWidth = 180;
  const nodeHeight = 100;
  const horizontalGap = 40;
  const verticalGap = 80;
  const startX = 100;
  const startY = 100;

  // Find root nodes (no manager)
  const rootNodes = nodes.filter((n) => !n.managerId);
  const nodesWithManager = nodes.filter((n) => n.managerId);

  // Build children map
  const childrenMap = new Map<string, TeamNode[]>();
  nodes.forEach((node) => {
    if (node.managerId) {
      const children = childrenMap.get(node.managerId) || [];
      children.push(node);
      childrenMap.set(node.managerId, children);
    }
  });

  // Calculate subtree width for each node
  const subtreeWidths = new Map<string, number>();

  function calculateSubtreeWidth(nodeId: string): number {
    if (subtreeWidths.has(nodeId)) {
      return subtreeWidths.get(nodeId)!;
    }

    const children = childrenMap.get(nodeId) || [];
    if (children.length === 0) {
      subtreeWidths.set(nodeId, nodeWidth);
      return nodeWidth;
    }

    const childrenWidth = children.reduce((sum, child) => {
      return sum + calculateSubtreeWidth(child.id);
    }, 0) + (children.length - 1) * horizontalGap;

    const width = Math.max(nodeWidth, childrenWidth);
    subtreeWidths.set(nodeId, width);
    return width;
  }

  // Calculate widths for all nodes
  nodes.forEach((node) => calculateSubtreeWidth(node.id));

  // Position nodes recursively
  function positionNode(
    node: TeamNode,
    centerX: number,
    y: number
  ): void {
    // Position this node at center
    positions.set(node.id, {
      x: centerX - nodeWidth / 2,
      y,
    });

    // Position children
    const children = childrenMap.get(node.id) || [];
    if (children.length === 0) return;

    // Calculate total children width
    const totalChildrenWidth = children.reduce((sum, child) => {
      return sum + subtreeWidths.get(child.id)!;
    }, 0) + (children.length - 1) * horizontalGap;

    // Start position for first child
    let childX = centerX - totalChildrenWidth / 2;

    children.forEach((child) => {
      const childWidth = subtreeWidths.get(child.id)!;
      const childCenterX = childX + childWidth / 2;

      positionNode(child, childCenterX, y + nodeHeight + verticalGap);

      childX += childWidth + horizontalGap;
    });
  }

  // Handle root nodes
  if (rootNodes.length > 0) {
    let rootX = startX;

    rootNodes.forEach((root) => {
      const rootWidth = subtreeWidths.get(root.id)!;
      const rootCenterX = rootX + rootWidth / 2;

      positionNode(root, rootCenterX, startY);

      rootX += rootWidth + horizontalGap * 2;
    });
  }

  // Handle orphan nodes (nodes whose manager doesn't exist)
  const positionedIds = new Set(positions.keys());
  const orphans = nodesWithManager.filter((n) => {
    // Check if this node has been positioned (its manager exists in the tree)
    return !positionedIds.has(n.id);
  });

  if (orphans.length > 0) {
    // Find the rightmost position
    let maxX = startX;
    positions.forEach((pos) => {
      maxX = Math.max(maxX, pos.x + nodeWidth);
    });

    // Position orphans in a row at the bottom
    let orphanX = maxX + horizontalGap * 2;
    const orphanY = startY;

    orphans.forEach((orphan) => {
      positions.set(orphan.id, { x: orphanX, y: orphanY });
      orphanX += nodeWidth + horizontalGap;
    });
  }

  return positions;
}
