import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { buildRiskDistribution, createDemoDashboard } from '../../dashboard-model';
import { RiskTopologyComponent } from './risk-topology.component';

describe('RiskTopologyComponent claims ownership', () => {
  it('preserves the app-risk-topology selector and accessible exposure summary after the move', () => {
    const dashboard = createDemoDashboard(new Date('2026-08-03T15:00:00.000Z'));
    @Component({
      standalone: true,
      imports: [RiskTopologyComponent],
      template: `<app-risk-topology [slices]="slices" [totalAtRisk]="totalAtRisk"></app-risk-topology>`
    })
    class HostComponent {
      readonly slices = buildRiskDistribution(dashboard);
      readonly totalAtRisk = dashboard.metrics.claimsAtRisk;
    }
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideZonelessChangeDetection()]
    });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('app-risk-topology')).not.toBeNull();
    expect(host.querySelector('svg[role="img"] title')?.textContent).toBe('Claims risk topology');
    expect(host.querySelector('svg[role="img"] desc')?.textContent).toContain('fictional exposure');
  });
});
