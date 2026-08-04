import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RiskSlice } from '../../dashboard-model';

@Component({
  selector: 'div[appClaimsFilters]',
  standalone: true,
  templateUrl: './claims-filters.component.html',
  styleUrl: './claims-filters.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClaimsFiltersComponent {
  readonly riskDistribution = input.required<readonly RiskSlice[]>();
  readonly payerOptions = input.required<readonly string[]>();
  readonly riskFilter = input.required<string>();
  readonly payerFilter = input.required<string>();
  readonly search = input.required<string>();
  readonly riskChanged = output<string>();
  readonly payerChanged = output<string>();
  readonly searchChanged = output<string>();
}
