import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { createDemoDashboard } from './dashboard-model';
import { OperationalRefreshStore } from './operational-refresh.store';
import { PortfolioScenarioController } from './portfolio-scenario.controller';

describe('AppComponent workspace extraction', () => {
  const dashboard = createDemoDashboard(new Date('2026-08-03T15:00:00.000Z'));
  const refreshStore = {
    dashboard: signal(dashboard),
    loading: signal(false),
    refreshing: signal(false),
    mutationPending: signal(false),
    apiMode: signal<'connecting' | 'live' | 'demo'>('live'),
    notice: signal('Live API data refreshed.'),
    stale: signal(false),
    updatedLabel: signal('Updated just now'),
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

  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: OperationalRefreshStore, useValue: refreshStore },
      { provide: PortfolioScenarioController, useValue: scenarioController }
    ]
  }));

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
});
