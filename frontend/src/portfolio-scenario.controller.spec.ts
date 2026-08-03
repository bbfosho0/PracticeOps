import { PortfolioScenario } from './dashboard-model';
import { resolveScenarioAction } from './portfolio-scenario.controller';

const scenario: PortfolioScenario = {
  id: 'practiceops-exception-journey',
  title: 'Resolve one exception',
  appointmentId: 'appointment-1',
  clinicalNoteId: 'note-1',
  claimId: 'claim-1',
  completedSteps: 0,
  totalSteps: 6,
  completionPercent: 0,
  currentStepId: 'confirm-appointment',
  currentWorkspace: 'schedule',
  steps: []
};

describe('Portfolio scenario action resolver', () => {
  it('maps each persisted step to one bounded transition', () => {
    expect(resolveScenarioAction({ ...scenario, currentStepId: 'confirm-appointment' })).toEqual({ kind: 'appointment', id: 'appointment-1', status: 'Confirmed', workspace: 'schedule' });
    expect(resolveScenarioAction({ ...scenario, currentStepId: 'submit-note-review' })).toEqual({ kind: 'note', id: 'note-1', status: 'InReview', workspace: 'documentation' });
    expect(resolveScenarioAction({ ...scenario, currentStepId: 'sign-note' })).toEqual({ kind: 'note', id: 'note-1', status: 'Signed', workspace: 'documentation' });
    expect(resolveScenarioAction({ ...scenario, currentStepId: 'clear-claim-risk' })).toEqual({ kind: 'claim', id: 'claim-1', status: 'ReadyForSubmission', workspace: 'claims' });
    expect(resolveScenarioAction({ ...scenario, currentStepId: 'submit-claim' })).toEqual({ kind: 'claim', id: 'claim-1', status: 'Submitted', workspace: 'claims' });
  });

  it('uses navigation only for the final proof step', () => {
    expect(resolveScenarioAction({ ...scenario, currentStepId: 'inspect-proof' })).toEqual({ kind: 'navigate', workspace: 'audit' });
  });
});
