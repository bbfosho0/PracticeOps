import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MetricSignal } from '../../dashboard-model';
import { MetricValueMotionDirective } from '../../metric-value-motion.directive';

@Component({
  selector: 'section[appMetricSignalStrip]',
  standalone: true,
  imports: [DecimalPipe, MetricValueMotionDirective],
  templateUrl: './metric-signal-strip.component.html',
  styleUrl: './metric-signal-strip.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'signal-strip',
    'aria-label': 'Primary operations metrics'
  }
})
export class MetricSignalStripComponent {
  readonly metrics = input.required<readonly MetricSignal[]>();
}
