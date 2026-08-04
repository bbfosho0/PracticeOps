import type { Meta, StoryObj } from '@storybook/angular';
import { Component, signal } from '@angular/core';
import { expect, userEvent, within } from 'storybook/test';
import type { Dashboard, PortfolioScenario, PortfolioScenarioStep } from '../../dashboard-model';
import { createDashboardFixture } from '../testing/practiceops-fixtures';
import { ScenarioControlsComponent } from './scenario-controls.component';

const dashboard = structuredClone(createDashboardFixture()) as Dashboard;

function scenarioArgs(scenario: PortfolioScenario = dashboard.scenario) {
  return {
    scenario,
    currentStep: scenario.steps.find(step => step.id === scenario.currentStepId) ?? scenario.steps[0],
    apiMode: 'live' as const,
    mutationPending: false,
    canMutate: true,
    complete: scenario.completedSteps === scenario.totalSteps,
    actionLabel: 'Complete current step'
  };
}

function inProgressScenario(): PortfolioScenario {
  const steps: PortfolioScenarioStep[] = dashboard.scenario.steps.map((step, index) => ({
    ...step,
    state: index < 2 ? 'complete' : index === 2 ? 'current' : 'pending'
  }));
  return {
    ...dashboard.scenario,
    completedSteps: 2,
    completionPercent: 40,
    currentStepId: steps[2].id,
    currentWorkspace: steps[2].workspace,
    steps
  };
}

function completeScenario(): PortfolioScenario {
  return {
    ...dashboard.scenario,
    completedSteps: dashboard.scenario.totalSteps,
    completionPercent: 100,
    currentStepId: dashboard.scenario.steps.at(-1)?.id ?? dashboard.scenario.currentStepId,
    currentWorkspace: 'audit',
    steps: dashboard.scenario.steps.map(step => ({ ...step, state: 'complete' }))
  };
}

const progressState = scenarioArgs(inProgressScenario());

@Component({
  selector: 'story-scenario-mutation-harness',
  standalone: true,
  imports: [ScenarioControlsComponent],
  template: `
    <section appScenarioControls [scenario]="state.scenario" [currentStep]="state.currentStep" apiMode="live"
      [mutationPending]="false" [canMutate]="true" [complete]="false" actionLabel="Complete current step"
      (continueRequested)="recordMutation()"></section>
    <output aria-label="Mutation requests">{{ mutations() }}</output>
  `
})
class ScenarioMutationStoryHarnessComponent {
  readonly state = progressState;
  readonly mutations = signal(0);

  recordMutation(): void {
    this.mutations.update(value => value + 1);
  }
}

const meta = {
  title: 'Clinical Observatory/System/Scenario Controls',
  component: ScenarioControlsComponent,
  tags: ['autodocs'],
  parameters: { layout: 'padded' }
} satisfies Meta<ScenarioControlsComponent>;

export default meta;
type Story = StoryObj<ScenarioControlsComponent>;

export const NotStarted: Story = { args: scenarioArgs() };

export const InProgress: Story = {
  args: { ...scenarioArgs(inProgressScenario()), canMutate: true },
  render: () => ({
    template: '<story-scenario-mutation-harness />',
    moduleMetadata: { imports: [ScenarioMutationStoryHarnessComponent] }
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Complete current step' }));
    await expect(canvas.getByRole('status', { name: 'Mutation requests' })).toHaveTextContent('1');
  }
};

export const Complete: Story = {
  args: { ...scenarioArgs(completeScenario()), actionLabel: 'Inspect proof' }
};

export const MutationDisabled: Story = {
  args: { ...scenarioArgs(inProgressScenario()), mutationPending: true, canMutate: false, actionLabel: 'Saving…' }
};

export const ApiUnavailable: Story = {
  args: {
    ...scenarioArgs(),
    apiMode: 'demo',
    canMutate: false,
    actionLabel: 'Live API required'
  }
};
