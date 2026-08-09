import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import {
  Appointment,
  AuditEvent,
  Claim,
  ClinicalNote,
  Dashboard,
  MetricSignal,
  PipelineStage,
  RiskSlice,
  ViewId,
  buildMetricSignals,
  buildPipelineStages,
  buildRiskDistribution,
  clampPercent,
  toneForStatus
} from './dashboard-model';
import {
  AuditTelemetry,
  ClinicianLoadMetric,
  DocumentationTelemetry,
  ScheduleTelemetry,
  buildAuditTelemetry,
  buildClinicianLoad,
  buildDocumentationTelemetry,
  buildScheduleTelemetry,
  reconcileDashboard
} from './operational-telemetry';
import { AtmosphereRenderer } from './atmosphere-renderer';
import { OperationalRefreshStore } from './operational-refresh.store';
import { PortfolioScenarioController } from './portfolio-scenario.controller';
import { resolveInitialScheduleDate } from './schedule-date';
import { ObservatoryShellComponent } from './app/shell/observatory-shell.component';
import { WorkspaceNavItem } from './app/shell/command-dock.component';
import { WorkspaceViewMetadata } from './app/shell/workspace-header.component';
import { OverviewWorkspaceComponent } from './app/overview/overview-workspace.component';
import { ScheduleWorkspaceComponent, filterScheduleAppointments } from './app/schedule/schedule-workspace.component';
import { RunwayBlock, buildRunwayBlocks } from './runway-blocks';
import { DocumentationWorkspaceComponent } from './app/documentation/documentation-workspace.component';
import { ClaimsWorkspaceComponent } from './app/claims/claims-workspace.component';
import { AuditWorkspaceComponent } from './app/audit/audit-workspace.component';
import { ScenarioControlsComponent } from './app/system/scenario-controls.component';
import { NotificationPreference, SystemWorkspaceComponent } from './app/system/system-workspace.component';

export type { WorkspaceNavItem } from './app/shell/command-dock.component';
export type { WorkspaceViewMetadata } from './app/shell/workspace-header.component';

export interface WorkspaceRuntimeInput {
  readonly mode: 'connecting' | 'live' | 'demo';
  readonly notice: string;
  readonly loading: boolean;
  readonly refreshing: boolean;
  readonly mutationPending: boolean;
  readonly stale: boolean;
  readonly readOnly: boolean;
  readonly updatedLabel: string;
}

export interface WorkspaceInput {
  readonly dashboard: Dashboard;
  readonly runtime: WorkspaceRuntimeInput;
}

export interface OverviewWorkspaceInput extends WorkspaceInput {
  readonly metrics: readonly MetricSignal[];
  readonly pipeline: readonly PipelineStage[];
  readonly riskDistribution: readonly RiskSlice[];
  readonly documentationTelemetry: DocumentationTelemetry;
  readonly auditTelemetry: AuditTelemetry;
}

export interface ScheduleWorkspaceInput extends WorkspaceInput {
  readonly appointments: readonly Appointment[];
  readonly selectedDate: Date;
  readonly selectedFilter: 'day' | 'week' | 'list';
  readonly providerOptions: readonly string[];
  readonly serviceOptions: readonly string[];
  readonly statusOptions: readonly string[];
  readonly selectedProvider: string;
  readonly selectedService: string;
  readonly selectedStatus: string;
  readonly telemetry: ScheduleTelemetry;
  readonly clinicianLoad: readonly ClinicianLoadMetric[];
  readonly runwayBlocks: readonly RunwayBlock[];
}

export interface DocumentationWorkspaceInput extends WorkspaceInput {
  readonly notes: readonly ClinicalNote[];
}

export interface ClaimsWorkspaceInput extends WorkspaceInput {
  readonly claims: readonly Claim[];
  readonly riskDistribution: readonly RiskSlice[];
}

export interface AuditWorkspaceInput extends WorkspaceInput {
  readonly auditEvents: readonly AuditEvent[];
}

export interface SystemWorkspaceInput extends WorkspaceInput {
  readonly activeView: ViewId;
}

export const WORKSPACE_NAV_ITEMS: readonly WorkspaceNavItem[] = [
  { id: 'overview', label: 'Overview', shortLabel: 'Overview', icon: 'M4 12a8 8 0 1 0 16 0 8 8 0 1 0-16 0Zm4.5 0a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0Z' },
  { id: 'schedule', label: 'Schedule', shortLabel: 'Schedule', icon: 'M5 4h14a1 1 0 0 1 1 1v14H4V5a1 1 0 0 1 1-1Zm2-2v4m10-4v4M4 9h16' },
  { id: 'documentation', label: 'Documentation', shortLabel: 'Docs', icon: 'M7 3h8l3 3v15H6V4a1 1 0 0 1 1-1Zm7 0v4h4M9 11h6M9 15h6M9 19h4' },
  { id: 'claims', label: 'Claims', shortLabel: 'Claims', icon: 'm12 3 8 9-8 9-8-9 8-9Zm0 5v8m-3-4h6' },
  { id: 'audit', label: 'Audit', shortLabel: 'Audit', icon: 'M11 4a7 7 0 1 0 5.9 10.8L21 19m-9-11v4l3 2' },
  { id: 'settings', label: 'System & Demo', shortLabel: 'System', icon: 'M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 1 0 12 8.5Zm0-5 1.2 2.3 2.6.5 1.8-1.8 1.9 1.9-1.8 1.8.5 2.6 2.3 1.2v2.7l-2.3 1.2-.5 2.6 1.8 1.8-1.9 1.9-1.8-1.8-2.6.5L12 20.5H9.3l-1.2-2.3-2.6-.5-1.8 1.8-1.9-1.9 1.8-1.8-.5-2.6L.8 12V9.3l2.3-1.2.5-2.6-1.8-1.8 1.9-1.9 1.8 1.8 2.6-.5L9.3.8H12Z' }
];

export const WORKSPACE_VIEW_METADATA: Readonly<Record<ViewId, WorkspaceViewMetadata>> = {
  overview: { eyebrow: 'Operational command workspace', title: 'Operations observatory', description: 'Current visibility across schedule, documentation, claim risk, and persisted activity.', liveLabel: 'Operational snapshot', tone: 'cyan' },
  schedule: { eyebrow: 'Operational command workspace', title: 'Temporal runway', description: 'Coordinate fictional appointments, confirmation exceptions, and clinician capacity.', liveLabel: 'Schedule state', tone: 'cyan' },
  documentation: { eyebrow: 'Operational command workspace', title: 'Documentation continuum', description: 'Move fictional notes from capture through review, signature, and billing readiness.', liveLabel: 'Documentation state', tone: 'violet' },
  claims: { eyebrow: 'Operational command workspace', title: 'Risk constellation', description: 'Resolve fictional validation, filing, and payer risk before reimbursement is delayed.', liveLabel: 'Claim state', tone: 'amber' },
  audit: { eyebrow: 'Persistence proof workspace', title: 'Event spectrum', description: 'Review immutable audit events and truthful transactional outbox delivery state.', liveLabel: 'Audit proof', tone: 'green' },
  settings: { eyebrow: 'Architecture proof workspace', title: 'System & Demo', description: 'Review runtime mode, scenario progress, delivery state, architecture, and safety boundaries.', liveLabel: 'System proof', tone: 'green' }
};

const INITIAL_PREFERENCES: NotificationPreference[] = [
  { label: 'System alerts', cadence: 'Browser-local', state: true },
  { label: 'Documentation updates', cadence: 'Browser-local', state: true },
  { label: 'Claims and risk notifications', cadence: 'Browser-local', state: true },
  { label: 'Schedule changes', cadence: 'Browser-local', state: true },
  { label: 'Team activity', cadence: 'Browser-local', state: false }
];

function startOfDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function sameLocalDay(value: string, reference: Date): boolean {
  const date = new Date(value);
  return date.getFullYear() === reference.getFullYear()
    && date.getMonth() === reference.getMonth()
    && date.getDate() === reference.getDate();
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ObservatoryShellComponent, OverviewWorkspaceComponent, ScheduleWorkspaceComponent, DocumentationWorkspaceComponent, ClaimsWorkspaceComponent, AuditWorkspaceComponent, ScenarioControlsComponent, SystemWorkspaceComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css', './tailwind-structure.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements AfterViewInit, OnDestroy {
  private readonly refreshStore = inject(OperationalRefreshStore);
  private readonly scenarioController = inject(PortfolioScenarioController);
  private atmosphereRenderer?: AtmosphereRenderer;
  @ViewChild('atmosphereCanvas') private readonly atmosphereCanvas?: ElementRef<HTMLCanvasElement>;

  readonly nav = WORKSPACE_NAV_ITEMS;
  readonly activeView = signal<ViewId>('overview');
  readonly dashboard = this.refreshStore.dashboard;
  readonly loading = this.refreshStore.loading;
  readonly refreshing = this.refreshStore.refreshing;
  readonly mutationPending = this.refreshStore.mutationPending;
  readonly apiMode = this.refreshStore.apiMode;
  readonly notice = this.refreshStore.notice;
  readonly stale = this.refreshStore.stale;
  readonly updatedLabel = this.refreshStore.updatedLabel;
  readonly runtimeReference = this.refreshStore.referenceTime;
  readonly kpiAnnouncement = this.refreshStore.kpiAnnouncement;
  readonly selectedScheduleFilter = signal<'day' | 'week' | 'list'>('day');
  readonly selectedScheduleDate = signal<Date | null>(null);
  readonly effectiveScheduleDate = computed(() => resolveInitialScheduleDate(this.dashboard().appointments, this.selectedScheduleDate()));
  readonly selectedProvider = signal('all');
  readonly selectedService = signal('all');
  readonly selectedStatus = signal('all');
  readonly claimRiskFilter = signal('all');
  readonly claimPayerFilter = signal('all');
  readonly claimSearch = signal('');
  readonly notificationPreferences = signal<NotificationPreference[]>(INITIAL_PREFERENCES.map(item => ({ ...item })));

  readonly view = computed(() => WORKSPACE_VIEW_METADATA[this.activeView()]);
  readonly scenario = this.scenarioController.scenario;
  readonly currentScenarioStep = this.scenarioController.currentStep;
  readonly scenarioActionLabel = this.scenarioController.actionLabel;
  readonly canMutateScenario = this.scenarioController.canMutate;
  readonly scenarioComplete = computed(() => this.scenario().completedSteps === this.scenario().totalSteps);
  readonly scenarioAppointmentId = computed(() => this.scenario().appointmentId);
  readonly scenarioClinicalNoteId = computed(() => this.scenario().clinicalNoteId);
  readonly scenarioClaimId = computed(() => this.scenario().claimId);
  readonly metrics = computed<MetricSignal[]>(() => buildMetricSignals(this.dashboard()));
  readonly pipeline = computed<PipelineStage[]>(() => buildPipelineStages(this.dashboard()));
  readonly riskDistribution = computed<RiskSlice[]>(() => buildRiskDistribution(this.dashboard()));
  readonly documentationTelemetry = computed(() => buildDocumentationTelemetry(this.dashboard()));
  readonly auditTelemetry = computed(() => buildAuditTelemetry(this.dashboard()));
  readonly auditEvents = computed(() => this.dashboard().audit.slice(0, 12));
  readonly scheduleDateLabel = computed(() => this.effectiveScheduleDate());
  readonly outboxState = computed(() => {
    if (this.apiMode() !== 'live') return { label: 'Preview only', detail: 'No delivery state is fabricated', tone: 'violet' as const };
    if (this.dashboard().outbox.pendingMessages > 0) return { label: 'Pending publication', detail: `${this.dashboard().outbox.pendingMessages} message${this.dashboard().outbox.pendingMessages === 1 ? '' : 's'} waiting`, tone: 'amber' as const };
    if (this.dashboard().outbox.publishedMessages > 0) return { label: 'Published', detail: `${this.dashboard().outbox.publishedMessages} broker-confirmed messages`, tone: 'green' as const };
    return { label: 'No scenario events yet', detail: 'Complete a persisted step to create proof', tone: 'cyan' as const };
  });
  readonly systemState = computed(() => {
    if (this.stale()) return { label: 'Stale snapshot', tone: 'amber' as const };
    if (this.apiMode() === 'live') return { label: 'Live API', tone: 'green' as const };
    if (this.apiMode() === 'connecting') return { label: 'Connecting', tone: 'cyan' as const };
    return { label: 'Synthetic preview', tone: 'violet' as const };
  });

  readonly appointmentsForSelectedDate = computed(() => this.dashboard().appointments.filter(item => sameLocalDay(item.startsAt, this.effectiveScheduleDate())));
  readonly providerOptions = computed(() => [...new Set(this.appointmentsForSelectedDate().map(item => item.clinician))].sort());
  readonly serviceOptions = computed(() => [...new Set(this.appointmentsForSelectedDate().map(item => item.service))].sort());
  readonly statusOptions = computed(() => [...new Set(this.appointmentsForSelectedDate().map(item => item.status))].sort());
  readonly filteredScheduleAppointments = computed(() => filterScheduleAppointments(this.appointmentsForSelectedDate(), {
    provider: this.selectedProvider(),
    service: this.selectedService(),
    status: this.selectedStatus()
  }));
  readonly filteredScheduleDashboard = computed(() => reconcileDashboard({
    ...this.dashboard(),
    appointments: this.filteredScheduleAppointments()
  }, this.effectiveScheduleDate()));
  readonly scheduleTelemetry = computed(() => buildScheduleTelemetry(this.filteredScheduleDashboard(), this.effectiveScheduleDate()));
  readonly clinicianLoad = computed(() => buildClinicianLoad(this.filteredScheduleDashboard(), this.effectiveScheduleDate()));
  readonly providerRows = computed(() => this.clinicianLoad().map(item => item.name));
  readonly noShowRiskAppointments = computed(() => this.filteredScheduleAppointments()
    .filter(item => ['Scheduled', 'NoShow', 'Cancelled'].includes(item.status))
    .slice(0, 3));
  readonly weekSummary = computed(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(this.effectiveScheduleDate());
    date.setDate(date.getDate() + index);
    const appointments = this.dashboard().appointments.filter(item => sameLocalDay(item.startsAt, date));
    const capacity = new Set(appointments.map(item => item.clinician)).size * 7;
    return {
      date,
      appointments: appointments.length,
      utilization: capacity === 0 ? 0 : clampPercent(Math.round((appointments.length / capacity) * 100))
    };
  }));

  readonly runwayBlocks = computed<RunwayBlock[]>(() => buildRunwayBlocks(this.filteredScheduleAppointments(), this.providerRows()));

  readonly waitlist = computed(() => this.dashboard().appointments
    .filter(item => item.status === 'Scheduled')
    .slice(0, 3)
    .map((item, index) => ({
      patient: item.patientDisplayName,
      requested: new Date(item.startsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      opening: `${index + 1} confirmation${index === 0 ? '' : 's'} pending`
    })));

  ngAfterViewInit(): void {
    if (this.atmosphereCanvas) {
      this.atmosphereRenderer = new AtmosphereRenderer(this.atmosphereCanvas.nativeElement);
      this.atmosphereRenderer.start();
    }
  }

  ngOnDestroy(): void {
    this.atmosphereRenderer?.destroy();
  }

  selectView(view: ViewId): void {
    this.activeView.set(view);
  }

  refresh(): void {
    this.refreshStore.refresh();
  }

  startScenario(): void {
    this.selectedScheduleDate.set(null);
    this.selectView(this.scenarioController.start());
  }

  resetScenario(): void {
    this.selectedScheduleDate.set(null);
    this.selectView(this.scenarioController.reset());
  }

  continueScenario(): void {
    this.selectView(this.scenarioController.performCurrentAction());
  }

  openScenarioWorkspace(): void {
    this.selectView(this.scenarioController.openCurrentWorkspace());
  }

  selectScheduleFilter(filter: 'day' | 'week' | 'list'): void {
    this.selectedScheduleFilter.set(filter);
  }

  shiftScheduleDate(days: number): void {
    const next = new Date(this.effectiveScheduleDate());
    next.setDate(next.getDate() + days);
    this.selectedScheduleDate.set(startOfDay(next));
  }

  setProvider(value: string): void {
    this.selectedProvider.set(value);
  }

  setService(value: string): void {
    this.selectedService.set(value);
  }

  setStatus(value: string): void {
    this.selectedStatus.set(value);
  }

  setClaimRisk(value: string): void {
    this.claimRiskFilter.set(value);
  }

  setClaimPayer(value: string): void {
    this.claimPayerFilter.set(value);
  }

  setClaimSearch(value: string): void {
    this.claimSearch.set(value);
  }

  clearClaimFilters(): void {
    this.claimRiskFilter.set('all');
    this.claimPayerFilter.set('all');
    this.claimSearch.set('');
  }

  toggleNotification(index: number): void {
    this.notificationPreferences.update(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, state: !item.state } : item));
  }

}
