import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import {
  Appointment,
  AuditEvent,
  Claim,
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
  createDemoDashboard,
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

interface NavItem {
  id: ViewId;
  label: string;
  shortLabel: string;
  icon: string;
}

interface ViewMeta {
  eyebrow: string;
  title: string;
  description: string;
  liveLabel: string;
  tone: SignalTone;
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

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', shortLabel: 'Overview', icon: 'M4 12a8 8 0 1 0 16 0 8 8 0 1 0-16 0Zm4.5 0a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0Z' },
  { id: 'schedule', label: 'Schedule', shortLabel: 'Schedule', icon: 'M5 4h14a1 1 0 0 1 1 1v14H4V5a1 1 0 0 1 1-1Zm2-2v4m10-4v4M4 9h16' },
  { id: 'documentation', label: 'Documentation', shortLabel: 'Docs', icon: 'M7 3h8l3 3v15H6V4a1 1 0 0 1 1-1Zm7 0v4h4M9 11h6M9 15h6M9 19h4' },
  { id: 'claims', label: 'Claims', shortLabel: 'Claims', icon: 'm12 3 8 9-8 9-8-9 8-9Zm0 5v8m-3-4h6' },
  { id: 'audit', label: 'Audit', shortLabel: 'Audit', icon: 'M11 4a7 7 0 1 0 5.9 10.8L21 19m-9-11v4l3 2' },
  { id: 'settings', label: 'Settings', shortLabel: 'Settings', icon: 'M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 1 0 12 8.5Zm0-5 1.2 2.3 2.6.5 1.8-1.8 1.9 1.9-1.8 1.8.5 2.6 2.3 1.2v2.7l-2.3 1.2-.5 2.6 1.8 1.8-1.9 1.9-1.8-1.8-2.6.5L12 20.5H9.3l-1.2-2.3-2.6-.5-1.8 1.8-1.9-1.9 1.8-1.8-.5-2.6L.8 12V9.3l2.3-1.2.5-2.6-1.8-1.8 1.9-1.9 1.8 1.8 2.6-.5L9.3.8H12Z' }
];

const VIEW_META: Record<ViewId, ViewMeta> = {
  overview: { eyebrow: 'Live operations workspace', title: 'Operations observatory', description: 'Real-time visibility across schedule, documentation, claims risk, and operational signals.', liveLabel: 'Live telemetry', tone: 'cyan' },
  schedule: { eyebrow: 'Live operations workspace', title: 'Temporal runway', description: 'Coordinate appointments, confirmations, clinician capacity, and check-ins in real time.', liveLabel: 'Live capacity', tone: 'cyan' },
  documentation: { eyebrow: 'Live operations workspace', title: 'Documentation continuum', description: 'Move every note from capture through review to signature and billing readiness.', liveLabel: 'Signature flow', tone: 'violet' },
  claims: { eyebrow: 'Live operations workspace', title: 'Risk constellation', description: 'Resolve validation, filing, and payer risk before it delays reimbursement.', liveLabel: 'Risk field live', tone: 'amber' },
  audit: { eyebrow: 'Live operations workspace', title: 'Event spectrum', description: 'Review immutable operational events and system signals across every workflow.', liveLabel: 'Observability live', tone: 'green' },
  settings: { eyebrow: 'Live operations workspace', title: 'Workspace parameters', description: 'Review demonstration boundaries, preferences, role access, and integration health.', liveLabel: 'Secure demo', tone: 'green' }
};

const INITIAL_PREFERENCES: NotificationPreference[] = [
  { label: 'System alerts', cadence: 'Real-time', state: true },
  { label: 'Documentation updates', cadence: 'Digest (Daily)', state: true },
  { label: 'Claims and risk notifications', cadence: 'Real-time', state: true },
  { label: 'Schedule changes', cadence: 'Instant', state: true },
  { label: 'Team activity', cadence: 'Digest (Daily)', state: false }
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
  return typeof window === 'undefined' || !window.matchMedia('(max-width: 1379px)').matches;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css', './app.component.workspaces.css', './portfolio-showcase.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements AfterViewInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private liveDashboard?: Dashboard;
  private atmosphereRenderer?: AtmosphereRenderer;
  @ViewChild('atmosphereCanvas') private readonly atmosphereCanvas?: ElementRef<HTMLCanvasElement>;

  readonly nav = NAV_ITEMS;
  readonly activeView = signal<ViewId>('overview');
  readonly dashboard = signal<Dashboard>(reconcileDashboard(createDemoDashboard()));
  readonly loading = signal(true);
  readonly apiMode = signal<'connecting' | 'live' | 'demo'>('connecting');
  readonly notice = signal('');
  readonly selectedScheduleFilter = signal<'day' | 'week' | 'list'>('day');
  readonly selectedScheduleDate = signal<Date>(startOfDay(new Date()));
  readonly selectedProvider = signal('all');
  readonly selectedService = signal('all');
  readonly selectedStatus = signal('all');
  readonly claimRiskFilter = signal('all');
  readonly claimPayerFilter = signal('all');
  readonly claimSearch = signal('');
  readonly notificationPreferences = signal<NotificationPreference[]>(INITIAL_PREFERENCES.map(item => ({ ...item })));
  readonly portfolioScenario = signal<'portfolio' | 'live'>('portfolio');
  readonly proofLayerOpen = signal(defaultProofLayerOpen());

  readonly view = computed(() => VIEW_META[this.activeView()]);
  readonly metrics = computed<MetricSignal[]>(() => buildMetricSignals(this.dashboard()));
  readonly pipeline = computed<PipelineStage[]>(() => buildPipelineStages(this.dashboard()));
  readonly riskDistribution = computed<RiskSlice[]>(() => buildRiskDistribution(this.dashboard()));
  readonly documentationTelemetry = computed(() => buildDocumentationTelemetry(this.dashboard()));
  readonly auditTelemetry = computed(() => buildAuditTelemetry(this.dashboard()));
  readonly spectrumBars = computed(() => this.auditTelemetry().spectrum);
  readonly auditEvents = computed(() => this.dashboard().audit.slice(0, 12));
  readonly scheduleDateLabel = computed(() => this.selectedScheduleDate());

  readonly appointmentsForSelectedDate = computed(() => this.dashboard().appointments.filter(item => sameLocalDay(item.startsAt, this.selectedScheduleDate())));
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
  }, this.selectedScheduleDate()));
  readonly scheduleTelemetry = computed(() => buildScheduleTelemetry(this.filteredScheduleDashboard(), this.selectedScheduleDate()));
  readonly clinicianLoad = computed(() => buildClinicianLoad(this.filteredScheduleDashboard(), this.selectedScheduleDate()));
  readonly providerRows = computed(() => this.clinicianLoad().map(item => item.name));
  readonly noShowRiskAppointments = computed(() => this.filteredScheduleAppointments()
    .filter(item => ['Scheduled', 'NoShow', 'Cancelled'].includes(item.status))
    .slice(0, 3));
  readonly weekSummary = computed(() => Array.from({ length: 7 }, (_, index) => {
    const date = new Date(this.selectedScheduleDate());
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
    const appointment = this.dashboard().appointments[index];
    return {
      claim,
      patient: appointment?.patientDisplayName ?? 'Synthetic record',
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
    return [
      { label: 'Events today', value: `${telemetry.eventsToday}`, detail: 'Current payload', tone: 'cyan' as const },
      { label: 'Signals / min', value: `${telemetry.signalsPerMinute}`, detail: 'Derived throughput', tone: 'violet' as const },
      { label: 'Error rate', value: `${telemetry.errorRate}%`, detail: `${telemetry.flaggedEvents} flagged`, tone: 'amber' as const },
      { label: 'Delivery rate', value: `${telemetry.deliveryRate}%`, detail: `${telemetry.deliveryEvents} delivery events`, tone: 'green' as const },
      { label: 'Flagged events', value: `${telemetry.flaggedEvents}`, detail: 'Needs review', tone: 'coral' as const },
      { label: 'Lag (p95)', value: `${telemetry.lagP95Seconds}s`, detail: 'Derived signal lag', tone: 'cyan' as const }
    ];
  });
  readonly auditCards = computed(() => {
    const telemetry = this.auditTelemetry();
    const signed = this.documentationTelemetry().signed;
    const claimEvents = telemetry.categories.find(item => item.label === 'Claims')?.count ?? 0;
    return [
      { title: 'Outbox delivery', value: `${telemetry.deliveryRate}%`, detail: 'Delivered', tone: 'cyan' as const },
      { title: 'Flagged events', value: `${telemetry.flaggedEvents}`, detail: 'Needs review', tone: 'coral' as const },
      { title: 'Note signatures', value: `${signed}`, detail: 'Signed', tone: 'green' as const },
      { title: 'Claim status changes', value: `${claimEvents}`, detail: 'Events', tone: 'blue' as const }
    ];
  });

  readonly waitlist = computed(() => this.dashboard().appointments
    .filter(item => item.status === 'Scheduled')
    .slice(0, 3)
    .map((item, index) => ({
      patient: item.patientDisplayName,
      requested: new Date(item.startsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      opening: `${index + 1} available slot${index === 0 ? '' : 's'}`
    })));

  readonly integrationHealth = computed(() => {
    const live = this.apiMode() === 'live';
    const notificationsEnabled = this.notificationPreferences().filter(item => item.state).length;
    return [
      { name: 'PracticeOps API', detail: live ? 'Live dashboard endpoint' : 'Local synthetic fallback', state: live ? 'Healthy' : 'Demo', tone: live ? 'cyan' as const : 'violet' as const },
      { name: 'Claims gateway', detail: `${this.dashboard().metrics.claimsAtRisk} claims monitored`, state: 'Healthy', tone: 'violet' as const },
      { name: 'Audit pipeline', detail: `${this.auditTelemetry().eventsToday} events loaded`, state: 'Healthy', tone: 'cyan' as const },
      { name: 'Notification service', detail: `${notificationsEnabled}/${this.notificationPreferences().length} preferences enabled`, state: notificationsEnabled > 0 ? 'Healthy' : 'Paused', tone: notificationsEnabled > 0 ? 'green' as const : 'amber' as const }
    ];
  });

  constructor() {
    this.load();
  }

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

  selectPortfolioScenario(mode: 'portfolio' | 'live'): void {
    this.portfolioScenario.set(mode);
    if (mode === 'portfolio') {
      this.applyDashboard(createDemoDashboard(), 'demo');
      this.notice.set('Portfolio scenario active. All records are fictional and designed to demonstrate the full workflow.');
      return;
    }
    if (this.liveDashboard) {
      this.applyDashboard(this.liveDashboard, 'live');
      this.notice.set('Live API data active. Switch back to Portfolio scenario for the curated demo day.');
      return;
    }
    this.notice.set('Live API data is unavailable. Portfolio scenario remains active.');
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
    const next = new Date(this.selectedScheduleDate());
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

  load(): void {
    this.loading.set(true);
    this.apiMode.set('connecting');
    this.notice.set('');

    this.http.get<Dashboard>('/api/dashboard').subscribe({
      next: value => {
        this.liveDashboard = value;
        if (this.portfolioScenario() === 'portfolio') {
          this.applyDashboard(createDemoDashboard(), 'demo');
          this.notice.set('Portfolio scenario active. Live API data is available to inspect.');
        } else {
          this.applyDashboard(value, 'live');
        }
      },
      error: () => {
        this.applyDashboard(createDemoDashboard(), 'demo');
        this.notice.set('API offline. Showing the complete local synthetic dataset.');
      }
    });
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

  private applyDashboard(value: Dashboard, mode: 'live' | 'demo'): void {
    const reference = value.appointments[0] ? new Date(value.appointments[0].startsAt) : new Date();
    const reconciled = reconcileDashboard(value, reference);
    this.dashboard.set(reconciled);
    this.selectedScheduleDate.set(startOfDay(reference));
    this.selectedProvider.set('all');
    this.selectedService.set('all');
    this.selectedStatus.set('all');
    this.apiMode.set(mode);
    this.loading.set(false);
  }
}
