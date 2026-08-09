import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { WORKSPACE_NAV_ITEMS, WORKSPACE_VIEW_METADATA } from '../../app.component';
import { ObservatoryShellComponent } from './observatory-shell.component';

@Component({
  standalone: true,
  imports: [ObservatoryShellComponent],
  template: `
    <div appObservatoryShell
      class="observatory"
      [items]="items"
      activeView="claims"
      runtimeMode="live"
      [metadata]="metadata"
      [runtimeStatus]="runtimeStatus"
      updatedLabel="Updated just now"
      [refreshing]="false"
      notice="Live API data refreshed."
      [stale]="stale"
      [retryAvailable]="true">
      <div class="atmosphere" aria-hidden="true"></div>
      <section class="projected-workspace">Workspace content</section>
    </div>
  `
})
class ShellTestHostComponent {
  readonly items = WORKSPACE_NAV_ITEMS;
  readonly metadata = WORKSPACE_VIEW_METADATA.claims;
  readonly runtimeStatus = { label: 'Live API', tone: 'green' as const };
  stale = false;
}

describe('ObservatoryShellComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));

  it('preserves the shell hierarchy and projects the active workspace into main', () => {
    const fixture = TestBed.createComponent(ShellTestHostComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const observatory = host.querySelector('.observatory') as HTMLElement;
    const main = observatory.querySelector(':scope > main.workspace') as HTMLElement;

    expect(observatory.querySelector(':scope > .atmosphere')).not.toBeNull();
    expect(observatory.querySelector(':scope > aside.command-dock')).not.toBeNull();
    expect(main.querySelector(':scope > header.workspace-header')).not.toBeNull();
    expect(main.querySelector(':scope > section.mode-notice')).not.toBeNull();
    expect(main.querySelector(':scope > section.projected-workspace')?.textContent).toContain('Workspace content');
  });

  it('labels a stale live snapshot as stale without changing the live API mode', () => {
    const fixture = TestBed.createComponent(ShellTestHostComponent);
    fixture.componentInstance.stale = true;
    fixture.detectChanges();
    const status = fixture.nativeElement.querySelector('.dock-status') as HTMLElement;

    expect(status.getAttribute('title')).toBe('Stale snapshot');
    expect(status.getAttribute('data-mode')).toBe('live');
  });
});
