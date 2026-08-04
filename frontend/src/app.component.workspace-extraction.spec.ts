import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { createDemoDashboard } from './dashboard-model';
import { OperationalRefreshStore } from './operational-refresh.store';
import { PortfolioScenarioController } from './portfolio-scenario.controller';

describe('AppComponent workspace extraction', () => {
  const fixtureReferenceTime = new Date('2026-08-03T15:00:00.000Z');
  const dashboard = createDemoDashboard(fixtureReferenceTime);
  const runtimeReference = signal(fixtureReferenceTime);
  const refreshStore = {
    dashboard: signal(dashboard),
    loading: signal(false),
    refreshing: signal(false),
    mutationPending: signal(false),
    apiMode: signal<'connecting' | 'live' | 'demo'>('live'),
    notice: signal('Live API data refreshed.'),
    stale: signal(false),
    updatedLabel: signal('Updated just now'),
    referenceTime: runtimeReference,
    kpiAnnouncement: signal('Operational metrics refreshed.'),
    refresh: jasmine.createSpy('refresh')
  };
  const scenarioController = {
    scenario: signal(dashboard.scenario),
    currentStep: signal(dashboard.scenario.steps[0]),
    actionLabel: signal('Complete current step'),
    canMutate: signal(true),
    start: () => 'schedule' as const,
    reset: () => 'schedule' as const,
    performCurrentAction: () => 'schedule' as const,
    openCurrentWorkspace: () => dashboard.scenario.currentWorkspace
  };

  beforeEach(() => {
    runtimeReference.set(fixtureReferenceTime);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: OperationalRefreshStore, useValue: refreshStore },
        { provide: PortfolioScenarioController, useValue: scenarioController }
      ]
    });
  });

  it('composes overview and schedule through focused workspace components', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    let host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('div[appOverviewWorkspace]')).not.toBeNull();
    expect(host.querySelector('div[appScheduleWorkspace]')).toBeNull();

    fixture.componentInstance.selectView('schedule');
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('div[appOverviewWorkspace]')).toBeNull();
    expect(host.querySelector('div[appScheduleWorkspace]')).not.toBeNull();
  });

  it('composes documentation through its focused workspace component', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.componentInstance.selectView('documentation');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('div[appDocumentationWorkspace]')).not.toBeNull();
    expect(host.querySelector('section[appDocumentationPipeline]')).not.toBeNull();
    expect(host.querySelector('article[appDocumentationQueue]')).not.toBeNull();
  });

  it('refreshes documentation ages from the root runtime reference', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.componentInstance.selectView('documentation');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.note-row time')?.textContent?.trim()).toBe('1h');

    runtimeReference.set(new Date('2026-08-04T15:00:00.000Z'));
    fixture.detectChanges();

    expect(host.querySelector('.note-row time')?.textContent?.trim()).toBe('1d');
  });

  it('composes claims through focused filter and table components', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.componentInstance.selectView('claims');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('div[appClaimsWorkspace]')).not.toBeNull();
    expect(host.querySelector('div[appClaimsFilters]')).not.toBeNull();
    expect(host.querySelector('article[appClaimsTable]')).not.toBeNull();
  });

  it('propagates claim filter intents through the root-owned state', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.componentInstance.selectView('claims');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const payer = host.querySelector('select[aria-label="Filter claims by payer"]') as HTMLSelectElement;
    const search = host.querySelector('input[aria-label="Search claims"]') as HTMLInputElement;

    payer.value = 'Aetna';
    payer.dispatchEvent(new Event('change', { bubbles: true }));
    search.value = 'CLM-740103';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();

    expect(fixture.componentInstance.claimPayerFilter()).toBe('Aetna');
    expect(fixture.componentInstance.claimSearch()).toBe('CLM-740103');
    expect(host.querySelectorAll('.claims-table .table-row:not(.table-head)').length).toBe(1);
  });

  it('composes audit through focused spectrum and timeline components', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.componentInstance.selectView('audit');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('div[appAuditWorkspace]')).not.toBeNull();
    expect(host.querySelector('article[appAuditSpectrum]')).not.toBeNull();
    expect(host.querySelector('article[appAuditTimeline]')).not.toBeNull();
  });

  it('composes system and shared scenario controls through focused components', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.componentInstance.selectView('settings');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('section[appScenarioControls]')).not.toBeNull();
    expect(host.querySelector('div[appSystemWorkspace]')).not.toBeNull();
  });

  it('does not retain workspace-only declarations in the root style scope', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const observatory = (fixture.nativeElement as HTMLElement).querySelector('.observatory') as HTMLElement;
    const rootScope = observatory.getAttributeNames().find(name => name.startsWith('_ngcontent')) ?? '';
    const parsedStyleSheets = Array.from(document.styleSheets).map(styleSheet => {
      try {
        return Array.from(styleSheet.cssRules)
          .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule)
          .map(rule => rule.selectorText)
          .filter(selector => selector.includes(rootScope));
      } catch {
        return [];
      }
    });
    const rootSelectors = (parsedStyleSheets.find(selectors =>
      selectors.some(selector => selector.includes('.aurora-primary'))
    ) ?? []).join(' ');

    for (const workspaceSelector of [
      '.panel-header',
      '.panel-subtitle',
      '.text-action',
      '.live-label',
      '.signal-orb',
      '.activity-icon',
      '.legend-dot',
      '.health-orb',
      '.pipeline',
      '.pipeline-stage',
      '.stage-label',
      '.pipeline-orb',
      '.pipeline-link'
    ]) {
      expect(rootSelectors).withContext(`${workspaceSelector} must be owned by its extracted component`).not.toContain(workspaceSelector);
    }
  });
});
