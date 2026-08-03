import { RiskSlice } from './dashboard-model';
import { buildRiskTopologyNodes } from './risk-topology';

describe('risk topology model', () => {
  const slices: readonly RiskSlice[] = [
    { label: 'Authorization', count: 5, exposure: 7200, tone: 'amber' },
    { label: 'Coding', count: 3, exposure: 4100, tone: 'coral' },
    { label: 'Filing', count: 2, exposure: 2600, tone: 'cyan' },
    { label: 'Payer', count: 2, exposure: 1800, tone: 'violet' }
  ];

  it('returns no nodes when there are no risk slices', () => {
    expect(buildRiskTopologyNodes([])).toEqual([]);
  });

  it('builds deterministic nodes that preserve operational values', () => {
    const first = buildRiskTopologyNodes(slices);
    const second = buildRiskTopologyNodes(slices);

    expect(first).toEqual(second);
    expect(first.map(node => node.count)).toEqual([5, 3, 2, 2]);
    expect(first.map(node => node.exposure)).toEqual([7200, 4100, 2600, 1800]);
    expect(new Set(first.map(node => `${node.x}:${node.y}`)).size).toBe(4);
  });

  it('connects every node from the topology center', () => {
    const nodes = buildRiskTopologyNodes(slices);

    expect(nodes.every(node => node.path.startsWith('M 320 180 Q '))).toBeTrue();
    expect(nodes.every(node => node.radius >= 28 && node.radius <= 42)).toBeTrue();
  });
});
