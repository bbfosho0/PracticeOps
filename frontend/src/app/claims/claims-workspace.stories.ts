import type { Meta, StoryObj } from '@storybook/angular';
import { Component, signal } from '@angular/core';
import { expect, userEvent, within } from 'storybook/test';
import type { Dashboard } from '../../dashboard-model';
import { buildRiskDistribution } from '../../dashboard-model';
import { createDashboardFixture } from '../testing/practiceops-fixtures';
import { ClaimsWorkspaceComponent } from './claims-workspace.component';

const dashboard = structuredClone(createDashboardFixture()) as Dashboard;

function claimsArgs() {
  return {
    claims: dashboard.claims,
    appointments: dashboard.appointments,
    auditEvents: dashboard.audit,
    claimsAtRisk: dashboard.metrics.claimsAtRisk,
    claimExposure: dashboard.metrics.claimExposure,
    riskDistribution: buildRiskDistribution(dashboard),
    scenarioClaimId: dashboard.scenario.claimId,
    scenarioAppointmentId: dashboard.scenario.appointmentId,
    riskFilter: 'all',
    payerFilter: 'all',
    search: ''
  };
}

@Component({
  selector: 'story-claims-workspace-harness',
  standalone: true,
  imports: [ClaimsWorkspaceComponent],
  template: `
    <div appClaimsWorkspace
      [claims]="fixture.claims" [appointments]="fixture.appointments" [auditEvents]="fixture.audit"
      [claimsAtRisk]="fixture.metrics.claimsAtRisk" [claimExposure]="fixture.metrics.claimExposure"
      [riskDistribution]="riskDistribution" [scenarioClaimId]="fixture.scenario.claimId"
      [scenarioAppointmentId]="fixture.scenario.appointmentId" [riskFilter]="risk()"
      [payerFilter]="payer()" [search]="search()" (riskChanged)="risk.set($event)"
      (payerChanged)="payer.set($event)" (searchChanged)="search.set($event)" (filtersCleared)="clear()">
    </div>
  `
})
class ClaimsWorkspaceStoryHarnessComponent {
  readonly fixture = dashboard;
  readonly riskDistribution = buildRiskDistribution(dashboard);
  readonly risk = signal('all');
  readonly payer = signal('all');
  readonly search = signal('');

  clear(): void {
    this.risk.set('all');
    this.payer.set('all');
    this.search.set('');
  }
}

const meta = {
  title: 'Clinical Observatory/Workspaces/Claims',
  component: ClaimsWorkspaceComponent,
  tags: ['autodocs']
} satisfies Meta<ClaimsWorkspaceComponent>;

export default meta;
type Story = StoryObj<ClaimsWorkspaceComponent>;

export const Populated: Story = {
  args: claimsArgs(),
  render: () => ({
    template: '<story-claims-workspace-harness />',
    moduleMetadata: { imports: [ClaimsWorkspaceStoryHarnessComponent] }
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const search = canvas.getByRole('searchbox', { name: 'Search claims' });
    await userEvent.type(search, dashboard.claims[0].number);
    await expect(search).toHaveValue(dashboard.claims[0].number);
    await expect(canvas.getAllByRole('row')).toHaveLength(2);
  }
};

export const Filtered: Story = {
  args: { ...claimsArgs(), payerFilter: dashboard.claims[0].payer }
};

export const NoMatches: Story = {
  args: { ...claimsArgs(), search: 'claim-that-does-not-exist' }
};

export const CriticalClaims: Story = {
  args: {
    ...claimsArgs(),
    claims: dashboard.claims.map(claim => ({ ...claim, status: 'Denied' })),
    claimsAtRisk: dashboard.claims.length
  }
};

export const MutationPending: Story = {
  args: {
    ...claimsArgs(),
    claims: dashboard.claims.map((claim, index) => index === 0 ? { ...claim, status: 'ReadyForSubmission' } : claim)
  },
  parameters: {
    docs: { description: { story: 'Deterministic snapshot while the scenario claim awaits its persisted submission transition.' } }
  }
};
