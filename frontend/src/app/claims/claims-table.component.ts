import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Claim, RiskSlice, SignalTone, humanizeStatus, riskCategory, toneForStatus } from '../../dashboard-model';
import { ClaimsFiltersComponent } from './claims-filters.component';

export interface ClaimTableRow {
  readonly claim: Claim;
  readonly patient: string;
  readonly appointmentAt?: string;
  readonly clinician: string;
  readonly ageDays: number;
}

@Component({
  selector: 'article[appClaimsTable]',
  standalone: true,
  imports: [ClaimsFiltersComponent, CurrencyPipe, DatePipe],
  templateUrl: './claims-table.component.html',
  styleUrl: './claims-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClaimsTableComponent {
  readonly rows = input.required<readonly ClaimTableRow[]>();
  readonly resultCount = input.required<number>();
  readonly riskDistribution = input.required<readonly RiskSlice[]>();
  readonly payerOptions = input.required<readonly string[]>();
  readonly riskFilter = input.required<string>();
  readonly payerFilter = input.required<string>();
  readonly search = input.required<string>();
  readonly scenarioClaimId = input.required<string>();
  readonly riskChanged = output<string>();
  readonly payerChanged = output<string>();
  readonly searchChanged = output<string>();

  statusLabel(value: string): string { return humanizeStatus(value); }
  tone(value: string): SignalTone { return toneForStatus(value); }
  riskLabel(claim: Claim): string { return riskCategory(claim.riskReason); }
}
