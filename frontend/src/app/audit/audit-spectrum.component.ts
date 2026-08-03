import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SignalTone } from '../../dashboard-model';
import { ApiMode } from '../../runtime-model';

@Component({
  selector: 'article[appAuditSpectrum]',
  standalone: true,
  templateUrl: './audit-spectrum.component.html',
  styleUrl: './audit-spectrum.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuditSpectrumComponent {
  readonly bars = input.required<readonly number[]>();
  readonly apiMode = input.required<ApiMode>();
  readonly updatedLabel = input.required<string>();

  toneForIndex(index: number): SignalTone {
    if (index < 16) return 'blue';
    if (index < 32) return 'violet';
    if (index < 45) return 'coral';
    if (index < 58) return 'amber';
    return 'cyan';
  }
}
