import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createDemoDashboard } from '../../dashboard-model';
import { SystemWorkspaceComponent } from './system-workspace.component';

describe('SystemWorkspaceComponent', () => {
  const dashboard = createDemoDashboard(new Date('2026-08-03T15:00:00.000Z'));
  const preferences = [
    { label: 'System alerts', cadence: 'Browser-local', state: true },
    { label: 'Schedule changes', cadence: 'Browser-local', state: false }
  ];

  beforeEach(() => TestBed.configureTestingModule({
    imports: [SystemWorkspaceComponent],
    providers: [provideZonelessChangeDetection()]
  }));

  function render(stale = false) {
    const fixture = TestBed.createComponent(SystemWorkspaceComponent);
    fixture.componentRef.setInput('dashboard', dashboard);
    fixture.componentRef.setInput('apiMode', 'live');
    fixture.componentRef.setInput('systemState', { label: stale ? 'Stale snapshot' : 'Live API', tone: stale ? 'amber' : 'green' });
    fixture.componentRef.setInput('updatedLabel', 'Updated just now');
    fixture.componentRef.setInput('stale', stale);
    fixture.componentRef.setInput('refreshing', false);
    fixture.componentRef.setInput('mutationPending', false);
    fixture.componentRef.setInput('outboxState', { label: 'Published', tone: 'green' });
    fixture.componentRef.setInput('preferences', preferences);
    fixture.detectChanges();
    return fixture;
  }

  it('preserves stale snapshot truth without disabling refresh', () => {
    const host = render(true).nativeElement as HTMLElement;

    expect(host.querySelector('.demo-boundary')?.textContent).toContain('Stale snapshot');
    expect(host.querySelector('.workspace-profile')?.textContent).toContain('Stale — last valid data retained');
    expect((host.querySelector('.workspace-profile button') as HTMLButtonElement).disabled).toBeFalse();
  });

  it('emits refresh, preference, reset, and audit navigation intents', () => {
    const fixture = render();
    let refreshes = 0;
    let resets = 0;
    let audits = 0;
    const toggles: number[] = [];
    fixture.componentInstance.refreshRequested.subscribe(() => refreshes++);
    fixture.componentInstance.resetRequested.subscribe(() => resets++);
    fixture.componentInstance.auditRequested.subscribe(() => audits++);
    fixture.componentInstance.preferenceToggled.subscribe(index => toggles.push(index));
    const host = fixture.nativeElement as HTMLElement;

    host.querySelector<HTMLButtonElement>('.workspace-profile button')?.click();
    host.querySelector<HTMLButtonElement>('.preference-toggle')?.click();
    host.querySelector<HTMLButtonElement>('.system-actions .scenario-secondary')?.click();
    host.querySelector<HTMLButtonElement>('.system-actions .scenario-primary')?.click();

    expect(refreshes).toBe(1);
    expect(toggles).toEqual([0]);
    expect(resets).toBe(1);
    expect(audits).toBe(1);
  });
});
