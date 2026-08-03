import { RiskSlice, SignalTone } from './dashboard-model';

export interface RiskTopologyNode {
  id: string;
  label: string;
  count: number;
  exposure: number;
  tone: SignalTone;
  x: number;
  y: number;
  radius: number;
  path: string;
}

const CENTER_X = 320;
const CENTER_Y = 180;

const NODE_POSITIONS = [
  { x: 130, y: 84 },
  { x: 510, y: 88 },
  { x: 124, y: 276 },
  { x: 516, y: 272 },
  { x: 320, y: 52 },
  { x: 320, y: 308 }
] as const;

function slugify(value: string, index: number): string {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return slug || `risk-${index + 1}`;
}

export function buildRiskTopologyNodes(slices: readonly RiskSlice[]): readonly RiskTopologyNode[] {
  return slices.map((slice, index) => {
    const position = NODE_POSITIONS[index % NODE_POSITIONS.length];
    const dx = position.x - CENTER_X;
    const dy = position.y - CENTER_Y;
    const controlX = Math.round(CENTER_X + dx * 0.48 - dy * 0.08);
    const controlY = Math.round(CENTER_Y + dy * 0.48 + dx * 0.05);
    const radius = Math.min(42, 28 + Math.round(Math.sqrt(Math.max(0, slice.count)) * 4));

    return {
      id: `${slugify(slice.label, index)}-${index}`,
      label: slice.label,
      count: slice.count,
      exposure: slice.exposure,
      tone: slice.tone,
      x: position.x,
      y: position.y,
      radius,
      path: `M ${CENTER_X} ${CENTER_Y} Q ${controlX} ${controlY} ${position.x} ${position.y}`
    };
  });
}
