import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RiskSlice } from './dashboard-model';
import { buildRiskTopologyNodes } from './risk-topology';

@Component({
  selector: 'app-risk-topology',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './risk-topology.component.html',
  styleUrl: './risk-topology.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RiskTopologyComponent {
  readonly slices = input.required<readonly RiskSlice[]>();
  readonly totalAtRisk = input.required<number>();
  readonly nodes = computed(() => buildRiskTopologyNodes(this.slices()));
  readonly totalExposure = computed(() => this.slices().reduce((total, slice) => total + slice.exposure, 0));
}
