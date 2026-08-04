import { provideZonelessChangeDetection } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { AutoAnimateDirective } from '../../auto-animate.directive';
import { buildRiskDistribution, createDemoDashboard } from '../../dashboard-model';
import { ClaimsWorkspaceComponent } from './claims-workspace.component';

describe('ClaimsWorkspaceComponent', () => {
  const dashboard = createDemoDashboard(new Date('2026-08-03T15:00:00.000Z'));

  beforeEach(() => TestBed.configureTestingModule({
    imports: [ClaimsWorkspaceComponent],
    providers: [provideZonelessChangeDetection()]
  }));

  function createFixture(search = '') {
    const fixture = TestBed.createComponent(ClaimsWorkspaceComponent);
    fixture.componentRef.setInput('claims', dashboard.claims);
    fixture.componentRef.setInput('appointments', dashboard.appointments);
    fixture.componentRef.setInput('auditEvents', dashboard.audit);
    fixture.componentRef.setInput('claimsAtRisk', dashboard.metrics.claimsAtRisk);
    fixture.componentRef.setInput('claimExposure', dashboard.metrics.claimExposure);
    fixture.componentRef.setInput('riskDistribution', buildRiskDistribution(dashboard));
    fixture.componentRef.setInput('scenarioClaimId', dashboard.scenario.claimId);
    fixture.componentRef.setInput('scenarioAppointmentId', dashboard.scenario.appointmentId);
    fixture.componentRef.setInput('riskFilter', 'all');
    fixture.componentRef.setInput('payerFilter', 'all');
    fixture.componentRef.setInput('search', search);
    fixture.detectChanges();
    return fixture;
  }

  it('renders populated claims through focused filters and table children', () => {
    const host = createFixture().nativeElement as HTMLElement;
    const header = host.querySelector('[role="row"].table-head') as HTMLElement;
    const dataRow = host.querySelector('[role="row"]:not(.table-head)') as HTMLElement;

    expect(host.querySelector('article[appClaimsTable]')).not.toBeNull();
    expect(host.querySelector('div[appClaimsFilters]')).not.toBeNull();
    expect(host.querySelectorAll('.claims-table .table-row:not(.table-head)').length).toBeGreaterThan(0);
    expect(host.querySelector('.claims-table .scenario-record')).not.toBeNull();
    expect(header.querySelectorAll(':scope > [role="columnheader"]').length).toBe(10);
    expect(dataRow.querySelectorAll(':scope > [role="cell"]').length).toBe(10);
  });

  it('renders the no-matches state for an unmatched immutable filter input', () => {
    const host = createFixture('claim-that-does-not-exist').nativeElement as HTMLElement;

    expect(host.querySelectorAll('.claims-table .table-row:not(.table-head)').length).toBe(0);
    expect(host.querySelector('.claims-table .workspace-empty')?.textContent).toContain('No claims match the current filters.');
  });

  it('emits a search intent without owning root filter state', () => {
    const fixture = createFixture();
    const searches: string[] = [];
    fixture.componentInstance.searchChanged.subscribe(value => searches.push(value));
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;

    input.value = 'fictional payer';
    input.dispatchEvent(new Event('input'));

    expect(searches).toEqual(['fictional payer']);
  });

  it('does not retain filtered-out claim rows while motion completes', () => {
    const fixture = createFixture();
    const table = fixture.debugElement.query(By.css('.claims-table'));

    expect(table.injector.get(AutoAnimateDirective, null)).toBeNull();
  });
});
