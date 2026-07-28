import type { TeamNode, Vertical, Settings, NodePosition } from '../types';

export interface ImportData {
  nodes: TeamNode[];
  verticals: Vertical[];
  settings: Settings;
  nodePositions?: NodePosition[];
}

export const isImportData = (data: unknown): data is ImportData => {
  if (!data || typeof data !== 'object') return false;

  const candidate = data as Partial<ImportData>;
  return (
    Array.isArray(candidate.nodes) &&
    Array.isArray(candidate.verticals) &&
    !!candidate.settings &&
    typeof candidate.settings === 'object' &&
    (candidate.nodePositions === undefined || Array.isArray(candidate.nodePositions))
  );
};

// base64url encoding for putting a chart into a `?chart=` URL param. Plain
// encodeURIComponent(JSON.stringify(...)) balloons in size because every quote/brace
// in JSON becomes a 3-character %XX sequence; base64url avoids that and its alphabet
// (A-Z a-z 0-9 - _) is already URL-safe, so no extra encodeURIComponent is needed.
export function encodeChartForUrl(data: ImportData): string {
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeChartFromUrl(encoded: string): unknown {
  let b64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) b64 += '=';
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}
