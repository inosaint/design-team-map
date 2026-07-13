import type { GrowthPlanItem, MeetingNote, Settings, TeamMember, TeamNode } from '../types';
import { getDesignerTypeName, getLevelColor, getLevelName } from './calculations';

type ChartExportNode = {
  id: string;
  name: string;
  level: string;
  color: string;
  managerId?: string | null;
  isPlannedHire: boolean;
  position: { x: number; y: number };
};

const NODE_WIDTH = 180;
const NODE_HEIGHT = 88;
const NODE_GAP = 64;
const HEADER_HEIGHT = 30;
const MAX_EXPORT_DIMENSION = 2400;
const EXPORT_PIXEL_RATIO = 2;
const GROWTH_STATUSES = [
  { status: 'planned', label: 'Planned' },
  { status: 'doing', label: 'Doing' },
  { status: 'completed', label: 'Completed' },
] as const;

export const getSafeFileName = (name: string, fallback = 'export') =>
  (name || fallback).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || fallback;

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const getMemberGrowthItems = (member: TeamMember): GrowthPlanItem[] => {
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

export const createGrowthPlanExport = (nodes: TeamNode[], settings: Settings) => {
  const members = nodes
    .filter((node): node is TeamMember => node.isPlannedHire === false)
    .map((member) => {
      const growthItems = getMemberGrowthItems(member);
      const sections = GROWTH_STATUSES.map(({ status, label }) => {
        const items = growthItems
          .filter((item) => item.status === status)
          .map((item) => ({
            id: item.id,
            content: item.content,
            details: item.details || '',
          }));

        return {
          status,
          label,
          itemCount: items.length,
          items,
        };
      });

      return {
        id: member.id,
        name: member.name,
        roleType: {
          id: member.designerType,
          name: getDesignerTypeName(member.designerType, settings),
        },
        level: {
          value: member.level,
          label: getLevelName(member.level, settings, member.track),
        },
        track: member.track || null,
        sections,
        meetingNotes: (member.meetingNotes || []).map((note: MeetingNote) => ({
          id: note.id,
          date: note.date,
          content: note.content,
        })),
      };
    });

  return {
    format: 'mapyour-org-growth-plan',
    version: 1,
    exportedAt: new Date().toISOString(),
    teamName: settings.teamName || 'My Team',
    members,
  };
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const truncateText = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;

const getExportAccentColor = (node: TeamNode, settings: Settings) => {
  const color = getLevelColor(node.level, settings, node.track).toLowerCase();
  const highContrastColors: Record<string, string> = {
    '#fed7aa': '#9a3412',
    '#fdba74': '#9a3412',
    '#fb923c': '#7c2d12',
    '#f97316': '#7c2d12',
    '#ea580c': '#7c2d12',
    '#86efac': '#166534',
    '#4ade80': '#166534',
    '#22c55e': '#166534',
    '#e5e7eb': '#374151',
    '#d1d5db': '#374151',
    '#9ca3af': '#374151',
    '#6b7280': '#374151',
    '#4b5563': '#374151',
  };

  return highContrastColors[color] || color;
};

const getChartExportNodes = (
  nodes: TeamNode[],
  positions: Map<string, { x: number; y: number }>,
  settings: Settings
): ChartExportNode[] => {
  let generatedPositionIndex = 0;

  return nodes.map((node) => {
    const storedPosition = positions.get(node.id);
    const generatedPosition = {
      x: 100 + ((positions.size + generatedPositionIndex) % 3) * 220,
      y: 100 + Math.floor((positions.size + generatedPositionIndex) / 3) * 150,
    };

    if (!storedPosition) {
      generatedPositionIndex++;
    }

    return {
      id: node.id,
      name: node.name,
      level: getLevelName(node.level, settings, node.track),
      color: getExportAccentColor(node, settings),
      managerId: node.managerId,
      isPlannedHire: node.isPlannedHire,
      position: storedPosition || generatedPosition,
    };
  });
};

export const createChartSvg = (
  nodes: TeamNode[],
  positions: Map<string, { x: number; y: number }>,
  settings: Settings
) => {
  const exportNodes = getChartExportNodes(nodes, positions, settings);

  if (exportNodes.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="420" viewBox="0 0 800 420"><rect width="800" height="420" fill="#ffffff"/><text x="400" y="210" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="20" font-weight="700" fill="#52525b">No chart data to export</text></svg>`;
  }

  const minX = Math.min(...exportNodes.map((node) => node.position.x));
  const minY = Math.min(...exportNodes.map((node) => node.position.y));
  const maxX = Math.max(...exportNodes.map((node) => node.position.x + NODE_WIDTH));
  const maxY = Math.max(...exportNodes.map((node) => node.position.y + NODE_HEIGHT + NODE_GAP));
  const padding = 56;
  const viewBoxWidth = Math.ceil(maxX - minX + padding * 2);
  const viewBoxHeight = Math.ceil(maxY - minY + padding * 2);
  const exportScale = Math.min(1, MAX_EXPORT_DIMENSION / Math.max(viewBoxWidth, viewBoxHeight));
  const width = Math.ceil(viewBoxWidth * exportScale);
  const height = Math.ceil(viewBoxHeight * exportScale);
  const offsetX = padding - minX;
  const offsetY = padding - minY;
  const nodeById = new Map(exportNodes.map((node) => [node.id, node]));

  const edges = exportNodes
    .filter((node) => node.managerId && nodeById.has(node.managerId))
    .map((node) => {
      const manager = nodeById.get(node.managerId!)!;
      const x1 = manager.position.x + offsetX + NODE_WIDTH / 2;
      const y1 = manager.position.y + offsetY + NODE_HEIGHT;
      const x2 = node.position.x + offsetX + NODE_WIDTH / 2;
      const y2 = node.position.y + offsetY;
      const midY = y1 + Math.max(24, (y2 - y1) / 2);
      return `<path d="M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}" fill="none" stroke="#71717a" stroke-width="3" stroke-linecap="round"/>`;
    })
    .join('');

  const cards = exportNodes
    .map((node) => {
      const x = node.position.x + offsetX;
      const y = node.position.y + offsetY;
      const borderDash = node.isPlannedHire ? ' stroke-dasharray="7 5"' : '';
      return `
        <g>
          <rect x="${x}" y="${y}" width="${NODE_WIDTH}" height="${NODE_HEIGHT}" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
          <rect x="${x + 1.5}" y="${y + 1.5}" width="${NODE_WIDTH - 3}" height="${NODE_HEIGHT - 3}" rx="7" fill="none" stroke="${node.color}" stroke-width="3"${borderDash}/>
          <rect x="${x + 3}" y="${y + 3}" width="${NODE_WIDTH - 6}" height="${HEADER_HEIGHT}" rx="5" fill="${node.color}"/>
          <rect x="${x + 3}" y="${y + 22}" width="${NODE_WIDTH - 6}" height="11" fill="${node.color}"/>
          <text x="${x + 14}" y="${y + 23}" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="12" font-weight="800" fill="#ffffff">${escapeXml(truncateText(node.level, 20))}</text>
          <text x="${x + 14}" y="${y + 60}" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="15" font-weight="800" fill="#111827">${escapeXml(truncateText(node.name, 18))}</text>
          ${node.isPlannedHire ? `<text x="${x + 14}" y="${y + 78}" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="11" font-weight="700" fill="#9a3412">planned</text>` : ''}
        </g>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}">
    <rect width="${viewBoxWidth}" height="${viewBoxHeight}" fill="#ffffff"/>
    <defs>
      <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="1" fill="#e4e4e7"/>
      </pattern>
    </defs>
    <rect width="${viewBoxWidth}" height="${viewBoxHeight}" fill="url(#dots)"/>
    ${edges}
    ${cards}
  </svg>`;
};

export const downloadSvgAsPng = async (svg: string, filename: string) => {
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const image = new Image();

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Unable to render chart image'));
      image.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth * EXPORT_PIXEL_RATIO;
    canvas.height = image.naturalHeight * EXPORT_PIXEL_RATIO;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas rendering is unavailable');
    context.scale(EXPORT_PIXEL_RATIO, EXPORT_PIXEL_RATIO);
    context.drawImage(image, 0, 0);

    await new Promise<void>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Unable to create chart PNG'));
          return;
        }
        downloadBlob(blob, filename);
        resolve();
      }, 'image/png');
    });
  } finally {
    URL.revokeObjectURL(url);
  }
};
