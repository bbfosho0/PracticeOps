import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { AutoAnimateDirective } from './auto-animate.directive';
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
  SignalTone,
  ViewId,
  buildMetricSignals,
  buildPipelineStages,
  buildRiskDistribution,
  clampPercent,
  formatCompactCurrency,
  humanizeStatus,
  initials,
  riskCategory,
  toneForStatus
} from './dashboard-model';
import {
  actionLabel,
  actionTone,
  buildAuditTelemetry,
  buildClinicianLoad,
  buildDocumentationTelemetry,
  buildScheduleTelemetry,
  reconcileDashboard
} from './operational-telemetry';
import { AtmosphereRenderer } from './atmosphere-renderer';
import { MetricValueMotionDirective } from './metric-value-motion.directive';
import { ObservatoryViewMotionDirective } from './observatory-view-motion.directive';
import { RiskTopologyComponent } from './risk-topology.component';
import { OperationalRefreshStore } from './operational-refresh.store';
import { PortfolioScenarioController } from './portfolio-scenario.controller';
import { resolveInitialScheduleDate } from './schedule-date';

export interface WorkspaceNavItem {
  id: ViewId;
  label: string;
  shortLabel: string;
  icon: string;
}

export interface WorkspaceViewMetadata {
  eyebrow: string;
  title: string;
  description: string;
  liveLabel: string;
  tone: SignalTone;
}

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
}

export interface ScheduleWorkspaceInput extends WorkspaceInput {
  readonly appointments: readonly Appointment[];
  readonly selectedDate: Date;
  readonly selectedFilter: 'day' | 'week' | 'list';
  readonly providerOptions: readonly string[];
  readonly serviceOptions: readonly string[];
  readonly statusOptions: readonly string[];
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

interface RunwayBlock {
  id: string;
  patient: string;
  clinician: string;
  service: string;
  status: string;
  time: string;
  row: number;
  column: string;
  tone: SignalTone;
}

interface NoteQueueItem {
  id: string;
  clinician: string;
  code: string;
  status: string;
  age: string;
  tone: SignalTone;
}

interface ClaimTableRow {
  claim: Claim;
  patient: string;
  appointmentAt?: string;
  clinician: string;
}

interface NotificationPreference {
  label: string;
  cadence: string;
  state: boolean;
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

function hoursSince(value: string, reference: Date): number {
  return Math.max(0, (reference.getTime() - new Date(value).getTime()) / 3_600_000);
}

function defaultProofLayerOpen(): boolean {
  return false;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe, MetricValueMotionDirective, RiskTopologyComponent, AutoAnimateDirective, ObservatoryViewMotionDirective],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css', './app.component.workspaces.css', './portfolio-showcase.css', './tailwind-structure.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements AfterViewInit, OnDestroy {
  private readonly refreshStore = inject(OperationalRefreshStore);
  readonly scenarioController = inject(PortfolioScenarioController);
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
  readonly proofLayerOpen = signal(defaultProofLayerOpen());

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
  readonly spectrumBars = computed(() => this.auditTelemetry().spectrum);
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
  readonly filteredScheduleAppointments = computed(() => this.appointmentsForSelectedDate().filter(item => {
    const providerMatches = this.selectedProvider() === 'all' || item.clinician === this.selectedProvider();
    const serviceMatches = this.selectedService() === 'all' || item.service === this.selectedService();
    const statusMatches = this.selectedStatus() === 'all' || item.status === this.selectedStatus();
    return providerMatches && serviceMatches && statusMatches;
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

  readonly runwayBlocks = computed<RunwayBlock[]>(() => {
    const source = this.filteredScheduleAppointments().slice(0, 18);
    return source.map((appointment, index) => {
      const start = new Date(appointment.startsAt);
      const hourOffset = Math.max(0, Math.min(9, start.getHours() - 8));
      const span = appointment.service.toLowerCase().includes('assessment') ? 2 : 1;
      return {
        id: appointment.id,
        patient: appointment.patientDisplayName,
        clinician: appointment.clinician,
        service: appointment.service,
        status: appointment.status,
        time: start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        row: Math.min(7, (index % Math.max(1, this.providerRows().length)) + 1),
        column: `${hourOffset + 1} / span ${span}`,
        tone: toneForStatus(appointment.status)
      };
    });
  });

  readonly noteQueue = computed<NoteQueueItem[]>(() =>
    this.dashboard().notes.filter(note => note.status !== 'Signed').slice(0, 7).map((note, index) => ({
      id: note.id,
      clinician: note.clinician,
      code: index % 2 === 0 ? '90837 · Individual therapy' : '90791 · Diagnostic evaluation',
      status: humanizeStatus(note.status),
      age: this.ageLabel(hoursSince(note.dueAt, new Date())),
      tone: toneForStatus(note.status)
    }))
  );

  readonly priorityFollowUps = computed(() => {
    const telemetry = this.documentationTelemetry();
    return [
      { label: 'Draft notes', detail: 'Documentation still in capture', count: telemetry.draft, tone: 'violet' as const },
      { label: 'Awaiting signature', detail: 'Clinician review is complete', count: telemetry.inReview, tone: 'amber' as const },
      { label: 'Over 24 hours', detail: 'Past the documentation target', count: telemetry.ageBuckets.overTwentyFourHours, tone: 'coral' as const },
      { label: 'Due within 24 hours', detail: 'Needs near-term attention', count: telemetry.ageBuckets.fourToTwentyFourHours, tone: 'cyan' as const }
    ];
  });

  readonly documentationHealth = computed(() => {
    const telemetry = this.documentationTelemetry();
    const onTimeRate = telemetry.unsigned === 0 ? 100 : Math.round(((telemetry.unsigned - telemetry.ageBuckets.overTwentyFourHours) / telemetry.unsigned) * 100);
    return [
      { value: `${Math.max(0, 100 - telemetry.returnedRate)}`, label: 'Quality score', tone: 'cyan' as const },
      { value: `${telemetry.completionRate}%`, label: 'Complete notes', tone: 'green' as const },
      { value: `${telemetry.returnedRate}%`, label: 'Draft rate', tone: 'violet' as const },
      { value: `${telemetry.averageAgeHours}h`, label: 'Average unsigned age', tone: 'blue' as const },
      { value: `${onTimeRate}%`, label: 'Within 24-hour target', tone: 'green' as const }
    ];
  });

  readonly filteredClaims = computed(() => {
    const query = this.claimSearch().trim().toLowerCase();
    return this.dashboard().claims.filter(claim => {
      const riskMatches = this.claimRiskFilter() === 'all' || riskCategory(claim.riskReason) === this.claimRiskFilter();
      const payerMatches = this.claimPayerFilter() === 'all' || claim.payer === this.claimPayerFilter();
      const queryMatches = query.length === 0 || `${claim.number} ${claim.payer} ${claim.riskReason}`.toLowerCase().includes(query);
      return riskMatches && payerMatches && queryMatches;
    });
  });
  readonly topClaims = computed(() => this.filteredClaims().slice(0, 8));
  readonly claimTableRows = computed<ClaimTableRow[]>(() => this.topClaims().map((claim, index) => {
    const appointment = claim.id === this.scenarioClaimId()
      ? this.dashboard().appointments.find(item => item.id === this.scenarioAppointmentId())
      : this.dashboard().appointments[index];
    return {
      claim,
      patient: appointment?.patientDisplayName ?? 'Fictional record',
      appointmentAt: appointment?.startsAt,
      clinician: appointment?.clinician ?? 'Revenue cycle'
    };
  }));
  readonly payerOptions = computed(() => [...new Set(this.dashboard().claims.map(item => item.payer))].sort());
  readonly claimTrendBars = computed(() => {
    const values = this.dashboard().claims.map(item => item.amount);
    const max = Math.max(...values, 1);
    return values.slice(0, 7).map(value => Math.max(20, Math.round((value / max) * 100)));
  });
  readonly payerWatchlist = computed(() => {
    const grouped = new Map<string, number>();
    for (const claim of this.dashboard().claims) grouped.set(claim.payer, (grouped.get(claim.payer) ?? 0) + claim.amount);
    const highest = Math.max(...grouped.values(), 1);
    return [...grouped.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([payer, exposure]) => ({
      payer,
      exposure,
      severity: exposure >= highest * 0.7 ? 'High' : exposure >= highest * 0.4 ? 'Medium' : 'Low',
      tone: exposure >= highest * 0.7 ? 'coral' as const : exposure >= highest * 0.4 ? 'amber' as const : 'green' as const
    }));
  });
  readonly recentClaimActions = computed(() => this.dashboard().claims.slice(0, 5).map((claim, index) => ({
    claim,
    action: actionLabel(claim.status),
    tone: actionTone(claim.status),
    time: this.dashboard().audit[index]?.occurredAt ?? this.dashboard().appointments[index]?.startsAt ?? new Date().toISOString()
  })));

  readonly eventTypeMetrics = computed(() => this.auditTelemetry().categories.map(category => ({
    label: category.label,
    count: category.count,
    share: `${category.share.toFixed(1)}%`,
    tone: category.tone
  })));
  readonly auditSummary = computed(() => {
    const telemetry = this.auditTelemetry();
    const outbox = this.dashboard().outbox;
    const categoryCount = (label: string) => telemetry.categories.find(item => item.label === label)?.count ?? 0;
    return [
      { label: 'Audit events', value: `${telemetry.eventsToday}`, detail: 'Current persisted snapshot', tone: 'cyan' as const },
      { label: 'Appointment events', value: `${categoryCount('Appointments')}`, detail: 'Persisted transitions', tone: 'blue' as const },
      { label: 'Documentation events', value: `${categoryCount('Documentation')}`, detail: 'Persisted transitions', tone: 'violet' as const },
      { label: 'Claim events', value: `${categoryCount('Claims')}`, detail: 'Persisted transitions', tone: 'amber' as const },
      { label: 'Outbox published', value: `${outbox.publishedMessages}`, detail: 'Broker-confirmed messages', tone: 'green' as const },
      { label: 'Outbox pending', value: `${outbox.pendingMessages}`, detail: outbox.pendingMessages ? 'Waiting for publication' : 'Queue clear', tone: outbox.pendingMessages ? 'amber' as const : 'green' as const }
    ];
  });
  readonly auditCards = computed(() => {
    const telemetry = this.auditTelemetry();
    const signed = this.documentationTelemetry().signed;
    const claimEvents = telemetry.categories.find(item => item.label === 'Claims')?.count ?? 0;
    const outbox = this.dashboard().outbox;
    return [
      { title: 'Outbox publication', value: `${outbox.publishedMessages}/${outbox.totalMessages}`, detail: this.outboxState().label, tone: this.outboxState().tone },
      { title: 'Pending messages', value: `${outbox.pendingMessages}`, detail: outbox.pendingMessages ? 'Retrying safely' : 'Queue clear', tone: outbox.pendingMessages ? 'amber' as const : 'green' as const },
      { title: 'Note signatures', value: `${signed}`, detail: 'Signed', tone: 'green' as const },
      { title: 'Claim status changes', value: `${claimEvents}`, detail: 'Audited events', tone: 'blue' as const }
    ];
  });

  readonly waitlist = computed(() => this.dashboard().appointments
    .filter(item => item.status === 'Scheduled')
    .slice(0, 3)
    .map((item, index) => ({
      patient: item.patientDisplayName,
      requested: new Date(item.startsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      opening: `${index + 1} confirmation${index === 0 ? '' : 's'} pending`
    })));

  readonly integrationHealth = computed(() => {
    const live = this.apiMode() === 'live';
    const outbox = this.dashboard().outbox;
    const notificationsEnabled = this.notificationPreferences().filter(item => item.state).length;
    return [
      { name: 'PracticeOps API', detail: live ? this.updatedLabel() : 'Static fictional preview', state: this.systemState().label, tone: this.systemState().tone },
      { name: 'PostgreSQL snapshot', detail: live ? 'Dashboard query completed' : 'Unavailable in preview mode', state: live ? 'Reachable' : 'Not connected', tone: live ? 'cyan' as const : 'violet' as const },
      { name: 'Transactional outbox', detail: `${outbox.publishedMessages} published · ${outbox.pendingMessages} pending`, state: this.outboxState().label, tone: this.outboxState().tone },
      { name: 'Local preferences', detail: `${notificationsEnabled}/${this.notificationPreferences().length} enabled in this browser`, state: 'Browser-local', tone: notificationsEnabled > 0 ? 'green' as const : 'amber' as const }
    ];
  });

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

  toggleProofLayer(): void {
    this.proofLayerOpen.update(value => !value);
  }

  showProofInWorkspace(view: ViewId): void {
    this.selectView(view);
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

  statusLabel(value: string): string {
    return humanizeStatus(value);
  }

  tone(value: string): SignalTone {
    return toneForStatus(value);
  }

  initials(value: string): string {
    return initials(value);
  }

  riskLabel(claim: Claim): string {
    return riskCategory(claim.riskReason);
  }

  compactCurrency(amount: number): string {
    return formatCompactCurrency(amount);
  }

  progress(value: number): number {
    return clampPercent(value);
  }

  round(value: number): number {
    return Math.round(value);
  }

  eventTone(event: AuditEvent, index: number): SignalTone {
    const normalized = `${event.action} ${event.summary}`.toLowerCase();
    if (normalized.includes('flag') || normalized.includes('error') || normalized.includes('denied')) return 'coral';
    if (normalized.includes('claim')) return 'amber';
    if (normalized.includes('note') || normalized.includes('documentation')) return 'violet';
    if (normalized.includes('appoint')) return 'cyan';
    return index % 2 === 0 ? 'green' : 'blue';
  }

  ageLabel(hours: number): string {
    if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
    if (hours < 24) return `${Math.round(hours)}h`;
    return `${Math.round(hours / 24)}d`;
  }

  trackAppointment(index: number, appointment: Appointment): string {
    return appointment.id || `${index}`;
  }
}
