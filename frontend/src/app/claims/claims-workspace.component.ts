import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Appointment, AuditEvent, Claim, RiskSlice, SignalTone, formatCompactCurrency, riskCategory } from '../../dashboard-model';
import { actionLabel, actionTone } from '../../operational-telemetry';
import { ClaimTableRow, ClaimsTableComponent } from './claims-table.component';

export interface PayerWatchlistItem {
  readonly payer: string;
  readonly exposure: number;
  readonly severity: 'High' | 'Medium' | 'Low';
  readonly tone: SignalTone;
}

export interface RecentClaimAction {
  readonly claim: Claim;
  readonly action: string;
  readonly tone: SignalTone;
  readonly time: string;
}

export interface ClaimFilterSelection {
  readonly risk: string;
  readonly payer: string;
  readonly search: string;
}

export function filterClaims(claims: readonly Claim[], filters: ClaimFilterSelection): Claim[] {
  const query = filters.search.trim().toLowerCase();
  return claims.filter(claim => {
    const riskMatches = filters.risk === 'all' || riskCategory(claim.riskReason) === filters.risk;
    const payerMatches = filters.payer === 'all' || claim.payer === filters.payer;
    const queryMatches = query.length === 0 || `${claim.number} ${claim.payer} ${claim.riskReason}`.toLowerCase().includes(query);
    return riskMatches && payerMatches && queryMatches;
  });
}

export function buildClaimTableRows(claims: readonly Claim[], appointments: readonly Appointment[], scenarioClaimId: string, scenarioAppointmentId: string): readonly ClaimTableRow[] {
  return claims.slice(0, 8).map((claim, index) => {
    const appointment = claim.id === scenarioClaimId
      ? appointments.find(item => item.id === scenarioAppointmentId)
      : appointments[index];
    return {
      claim,
      patient: appointment?.patientDisplayName ?? 'Fictional record',
      appointmentAt: appointment?.startsAt,
      clinician: appointment?.clinician ?? 'Revenue cycle',
      ageDays: 18 - index * 3
    };
  });
}

@Component({
  selector: 'div[appClaimsWorkspace]',
  standalone: true,
  imports: [ClaimsTableComponent, CurrencyPipe, DatePipe],
  templateUrl: './claims-workspace.component.html',
  styleUrl: './claims-workspace.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'claims-workspace-root',
    'data-workspace-motion-root': ''
  }
})
export class ClaimsWorkspaceComponent {
  readonly claims = input.required<readonly Claim[]>();
  readonly appointments = input.required<readonly Appointment[]>();
  readonly auditEvents = input.required<readonly AuditEvent[]>();
  readonly claimsAtRisk = input.required<number>();
  readonly claimExposure = input.required<number>();
  readonly riskDistribution = input.required<readonly RiskSlice[]>();
  readonly scenarioClaimId = input.required<string>();
  readonly scenarioAppointmentId = input.required<string>();
  readonly riskFilter = input.required<string>();
  readonly payerFilter = input.required<string>();
  readonly search = input.required<string>();
  readonly riskChanged = output<string>();
  readonly payerChanged = output<string>();
  readonly searchChanged = output<string>();
  readonly filtersCleared = output<void>();

  readonly filteredClaims = computed(() => filterClaims(this.claims(), { risk: this.riskFilter(), payer: this.payerFilter(), search: this.search() }));
  readonly tableRows = computed(() => buildClaimTableRows(this.filteredClaims(), this.appointments(), this.scenarioClaimId(), this.scenarioAppointmentId()));
  readonly payerOptions = computed(() => [...new Set(this.claims().map(item => item.payer))].sort());
  readonly trendBars = computed(() => {
    const values = this.claims().map(item => item.amount);
    const max = Math.max(...values, 1);
    return values.slice(0, 7).map(value => Math.max(20, Math.round((value / max) * 100)));
  });
  readonly payerWatchlist = computed<readonly PayerWatchlistItem[]>(() => {
    const grouped = new Map<string, number>();
    for (const claim of this.claims()) grouped.set(claim.payer, (grouped.get(claim.payer) ?? 0) + claim.amount);
    const highest = Math.max(...grouped.values(), 1);
    return [...grouped.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([payer, exposure]) => ({
      payer,
      exposure,
      severity: exposure >= highest * .7 ? 'High' : exposure >= highest * .4 ? 'Medium' : 'Low',
      tone: exposure >= highest * .7 ? 'coral' : exposure >= highest * .4 ? 'amber' : 'green'
    }));
  });
  readonly recentActions = computed<readonly RecentClaimAction[]>(() => this.claims().slice(0, 5).map((claim, index) => ({
    claim,
    action: actionLabel(claim.status),
    tone: actionTone(claim.status),
    time: this.auditEvents()[index]?.occurredAt ?? this.appointments()[index]?.startsAt ?? new Date().toISOString()
  })));

  compactCurrency(amount: number): string { return formatCompactCurrency(amount); }
}
