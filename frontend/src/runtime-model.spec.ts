import type { ApiMode } from './runtime-model';

describe('runtime model', () => {
  it('defines the complete neutral API mode contract', () => {
    const modes: readonly ApiMode[] = ['connecting', 'live', 'demo'];

    expect(modes).toEqual(['connecting', 'live', 'demo']);
  });
});
