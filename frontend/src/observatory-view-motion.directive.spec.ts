import { resolveWorkspaceMotionSurfaces } from './observatory-view-motion.directive';

describe('resolveWorkspaceMotionSurfaces', () => {
  it('preserves per-surface GSAP boundaries inside an extracted workspace host', () => {
    const workspace = document.createElement('main');
    workspace.innerHTML = `
      <header class="workspace-header"></header>
      <div data-workspace-motion-root>
        <p class="sr-only">Announcement</p>
        <section class="signal-strip"></section>
        <section class="overview-grid"></section>
      </div>
    `;

    expect(resolveWorkspaceMotionSurfaces(workspace).map(surface => surface.className)).toEqual([
      'signal-strip',
      'overview-grid'
    ]);
  });

  it('keeps direct projected workspace surfaces compatible', () => {
    const workspace = document.createElement('main');
    workspace.innerHTML = `
      <header class="workspace-header"></header>
      <section class="claims-hero-grid"></section>
      <section class="claims-table-panel"></section>
    `;

    expect(resolveWorkspaceMotionSurfaces(workspace).map(surface => surface.className)).toEqual([
      'claims-hero-grid',
      'claims-table-panel'
    ]);
  });
});
