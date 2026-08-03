import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AutoAnimateDirective } from '../../auto-animate.directive';
import { PortfolioScenario, PortfolioScenarioStep, ViewId } from '../../dashboard-model';
import { ApiMode } from '../../operational-refresh.store';

@Component({
  selector: 'section[appScenarioControls]',
  standalone: true,
  imports: [AutoAnimateDirective],
  templateUrl: './scenario-controls.component.html',
  styleUrl: './scenario-controls.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-state]': `apiMode() === 'live' ? (complete() ? 'complete' : 'active') : 'preview'`,
    '[attr.aria-labelledby]': `'scenario-title'`
  }
})
export class ScenarioControlsComponent {
  readonly scenario = input.required<Readonly<PortfolioScenario>>();
  readonly currentStep = input.required<Readonly<PortfolioScenarioStep>>();
  readonly apiMode = input.required<ApiMode>();
  readonly mutationPending = input.required<boolean>();
  readonly canMutate = input.required<boolean>();
  readonly complete = input.required<boolean>();
  readonly actionLabel = input.required<string>();
  readonly startRequested = output<void>();
  readonly workspaceRequested = output<void>();
  readonly continueRequested = output<void>();
  readonly stepSelected = output<ViewId>();
}
