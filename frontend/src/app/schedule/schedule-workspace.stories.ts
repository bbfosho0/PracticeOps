import type { Meta, StoryObj } from '@storybook/angular';
import { Component, signal } from '@angular/core';
import { expect, userEvent, within } from 'storybook/test';
import type { Appointment, Dashboard } from '../../dashboard-model';
import { toneForStatus } from '../../dashboard-model';
import { buildClinicianLoad, buildScheduleTelemetry, reconcileDashboard } from '../../operational-telemetry';
import { createDashboardFixture } from '../testing/practiceops-fixtures';
import type { ScheduleMode } from './schedule-filters.component';
import type { WeekSummaryDay } from './schedule-workspace.component';
import { ScheduleWorkspaceComponent } from './schedule-workspace.component';
import type { RunwayBlock } from './temporal-runway.component';

const dashboard = structuredClone(createDashboardFixture()) as Dashboard;
const selectedDate = new Date(dashboard.appointments[0].startsAt);

function scheduleArgs(mode: ScheduleMode = 'day', appointments: readonly Appointment[] = dashboard.appointments) {
  const snapshot = reconcileDashboard({ ...dashboard, appointments: [...appointments] }, selectedDate);
  const clinicians = buildClinicianLoad(snapshot, selectedDate);
  const providerRows = clinicians.map(item => item.name);
  const runwayBlocks: RunwayBlock[] = appointments.slice(0, 18).map((appointment, index) => {
    const start = new Date(appointment.startsAt);
    const hourOffset = Math.max(0, Math.min(9, start.getHours() - 8));
    return {
      id: appointment.id,
      patient: appointment.patientDisplayName,
      clinician: appointment.clinician,
      service: appointment.service,
      status: appointment.status,
      time: start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      row: Math.min(7, (index % Math.max(1, providerRows.length)) + 1),
      column: `${hourOffset + 1} / span ${appointment.service.toLowerCase().includes('assessment') ? 2 : 1}`,
      tone: toneForStatus(appointment.status)
    };
  });
  const weekSummary: WeekSummaryDay[] = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + index);
    const count = index === 0 ? appointments.length : 0;
    return { date, appointments: count, utilization: index === 0 ? snapshot.metrics.teamUtilization : 0 };
  });

  return {
    appointments,
    selectedDate,
    mode,
    providerOptions: [...new Set(dashboard.appointments.map(item => item.clinician))].sort(),
    serviceOptions: [...new Set(dashboard.appointments.map(item => item.service))].sort(),
    statusOptions: [...new Set(dashboard.appointments.map(item => item.status))].sort(),
    selectedProvider: 'all',
    selectedService: 'all',
    selectedStatus: 'all',
    telemetry: buildScheduleTelemetry(snapshot, selectedDate),
    clinicianLoad: clinicians,
    runwayBlocks,
    weekSummary,
    noShowRiskAppointments: appointments.filter(item => ['Scheduled', 'NoShow', 'Cancelled'].includes(item.status)).slice(0, 3),
    waitlist: dashboard.appointments.filter(item => item.status === 'Scheduled').slice(0, 3).map((item, index) => ({
      patient: item.patientDisplayName,
      requested: new Date(item.startsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      opening: `${index + 1} confirmation${index === 0 ? '' : 's'} pending`
    })),
    scenarioAppointmentId: dashboard.scenario.appointmentId
  };
}

const dayState = scheduleArgs('day');

@Component({
  selector: 'story-schedule-workspace-harness',
  standalone: true,
  imports: [ScheduleWorkspaceComponent],
  template: `
    <div appScheduleWorkspace
      [appointments]="state.appointments" [selectedDate]="state.selectedDate" [mode]="mode()"
      [providerOptions]="state.providerOptions" [serviceOptions]="state.serviceOptions" [statusOptions]="state.statusOptions"
      [selectedProvider]="provider()" [selectedService]="service()" [selectedStatus]="status()"
      [telemetry]="state.telemetry" [clinicianLoad]="state.clinicianLoad" [runwayBlocks]="state.runwayBlocks"
      [weekSummary]="state.weekSummary" [noShowRiskAppointments]="state.noShowRiskAppointments"
      [waitlist]="state.waitlist" [scenarioAppointmentId]="state.scenarioAppointmentId"
      (modeChanged)="mode.set($event)" (statusChanged)="status.set($event)"
      (providerChanged)="provider.set($event)" (serviceChanged)="service.set($event)">
    </div>
  `
})
class ScheduleWorkspaceStoryHarnessComponent {
  readonly state = dayState;
  readonly mode = signal<ScheduleMode>('day');
  readonly status = signal('all');
  readonly provider = signal('all');
  readonly service = signal('all');
}

const meta = {
  title: 'Clinical Observatory/Workspaces/Schedule',
  component: ScheduleWorkspaceComponent,
  tags: ['autodocs']
} satisfies Meta<ScheduleWorkspaceComponent>;

export default meta;
type Story = StoryObj<ScheduleWorkspaceComponent>;

export const Day: Story = {
  args: scheduleArgs('day'),
  render: () => ({
    template: '<story-schedule-workspace-harness />',
    moduleMetadata: { imports: [ScheduleWorkspaceStoryHarnessComponent] }
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'List' }));
    await expect(canvas.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByText('Appointment list')).toBeInTheDocument();
  }
};

export const Week: Story = { args: scheduleArgs('week') };
export const List: Story = { args: scheduleArgs('list') };
export const EmptySchedule: Story = { args: scheduleArgs('list', []) };
export const ActiveProviderFilter: Story = {
  args: {
    ...scheduleArgs('day', dashboard.appointments.filter(item => item.clinician === dashboard.appointments[0].clinician)),
    selectedProvider: dashboard.appointments[0].clinician
  }
};
