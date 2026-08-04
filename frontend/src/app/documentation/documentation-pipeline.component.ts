import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PipelineStage } from '../../dashboard-model';

@Component({
  selector: 'section[appDocumentationPipeline]',
  standalone: true,
  templateUrl: './documentation-pipeline.component.html',
  styleUrl: './documentation-pipeline.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    tabindex: '0',
    'aria-label': 'Documentation pipeline'
  }
})
export class DocumentationPipelineComponent {
  readonly stages = input.required<readonly PipelineStage[]>();
}
