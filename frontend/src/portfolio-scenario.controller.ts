import { Injectable, computed, inject } from '@angular/core';
import { PortfolioScenario, ViewId } from './dashboard-model';
import { OperationalRefreshStore } from './operational-refresh.store';
import { PracticeOpsApiService } from './practiceops-api.service';

export type ScenarioAction =
  | { kind: 'appointment'; id: string; status: 'Confirmed'; workspace: 'schedule' }
  | { kind: 'note'; id: string; status: 'InReview' | 'Signed'; workspace: 'documentation' }
  | { kind: 'claim'; id: string; status: 'ReadyForSubmission' | 'Submitted'; workspace: 'claims' }
  | { kind: 'navigate'; workspace: 'audit' };

export function resolveScenarioAction(scenario: PortfolioScenario): ScenarioAction {
  switch (scenario.currentStepId) {
    case 'confirm-appointment':
      return { kind: 'appointment', id: scenario.appointmentId, status: 'Confirmed', workspace: 'schedule' };
    case 'submit-note-review':
      return { kind: 'note', id: scenario.clinicalNoteId, status: 'InReview', workspace: 'documentation' };
    case 'sign-note':
      return { kind: 'note', id: scenario.clinicalNoteId, status: 'Signed', workspace: 'documentation' };
    case 'clear-claim-risk':
      return { kind: 'claim', id: scenario.claimId, status: 'ReadyForSubmission', workspace: 'claims' };
    case 'submit-claim':
      return { kind: 'claim', id: scenario.claimId, status: 'Submitted', workspace: 'claims' };
    default:
      return { kind: 'navigate', workspace: 'audit' };
  }
}

@Injectable({ providedIn: 'root' })
export class PortfolioScenarioController {
  private readonly store = inject(OperationalRefreshStore);
  private readonly api = inject(PracticeOpsApiService);

  readonly scenario = computed(() => this.store.dashboard().scenario);
  readonly currentStep = computed(() => {
    const scenario = this.scenario();
    return scenario.steps.find(step => step.id === scenario.currentStepId) ?? scenario.steps[scenario.steps.length - 1];
  });
  readonly canMutate = computed(() => this.store.apiMode() === 'live' && !this.store.mutationPending());
  readonly actionLabel = computed(() => {
    if (this.store.apiMode() !== 'live') return 'Live API required';
    if (this.store.mutationPending()) return 'Saving…';
    return this.scenario().currentStepId === 'inspect-proof' ? 'Inspect proof' : 'Complete current step';
  });

  start(): ViewId {
    this.store.resetDemo();
    return 'schedule';
  }

  reset(): ViewId {
    this.store.resetDemo();
    return 'schedule';
  }

  openCurrentWorkspace(): ViewId {
    return this.scenario().currentWorkspace;
  }

  performCurrentAction(): ViewId {
    const action = resolveScenarioAction(this.scenario());
    if (action.kind === 'navigate') {
      this.store.notice.set('Audit and outbox proof are shown from the authoritative live snapshot.');
      return action.workspace;
    }

    const request = action.kind === 'appointment'
      ? this.api.transitionAppointment(action.id, action.status)
      : action.kind === 'note'
        ? this.api.transitionNote(action.id, action.status)
        : this.api.transitionClaim(action.id, action.status);
    this.store.runMutation(request, 'Workflow transition saved. Refreshing every affected workspace…');
    return action.workspace;
  }
}
