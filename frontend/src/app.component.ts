import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
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

interface ClinicianLoad {
  name: string;
  utilization: number;
}

interface NoteQueueItem {
  id: string;
  clinician: string;
  code: string;
  status: string;
  age: string;
  tone: SignalTone;
}

interface EventTypeMetric {
  label: string;
  count: number;
  share: string;
  tone: SignalTone;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    shortLabel: 'Overview',
    icon: 'M4 12a8 8 0 1 0 16 0 8 8 0 1 0-16 0Zm4.5 0a3.5 3.5 0 1 1 7 0 3.5 3.5 0 1 1-7 0Z'
  },
  {
    id: 'schedule',
    label: 'Schedule',
    shortLabel: 'Schedule',
    icon: 'M5 4h14a1 1 0 0 1 1 1v14H4V5a1 1 0 0 1 1-1Zm2-2v4m10-4v4M4 9h16'
  },
  {
    id: 'documentation',
    label: 'Documentation',
    shortLabel: 'Docs',
    icon: 'M7 3h8l3 3v15H6V4a1 1 0 0 1 1-1Zm7 0v4h4M9 11h6M9 15h6M9 19h4'
  },
  {
    id: 'claims',
    label: 'Claims',
    shortLabel: 'Claims',
    icon: 'm12 3 8 9-8 9-8-9 8-9Zm0 5v8m-3-4h6'
  },
  {
    id: 'audit',
    label: 'Audit',
    shortLabel: 'Audit',
    icon: 'M11 4a7 7 0 1 0 5.9 10.8L21 19m-9-11v4l3 2'
  },
  {
    id: 'settings',
    label: 'Settings',
    shortLabel: 'Settings',
    icon: 'M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 1 0 12 8.5Zm0-5 1.2 2.3 2.6.5 1.8-1.8 1.9 1.9-1.8 1.8.5 2.6 2.3 1.2v2.7l-2.3 1.2-.5 2.6 1.8 1.8-1.9 1.9-1.8-1.8-2.6.5L12 20.5H9.3l-1.2-2.3-2.6-.5-1.8 1.8-1.9-1.9 1.8-1.8-.5-2.6L.8 12V9.3l2.3-1.2.5-2.6-1.8-1.8 1.9-1.9 1.8 1.8 2.6-.5L9.3.8H12Z'
  }
];

const VIEW_META: Record<ViewId, ViewMeta> = {
  overview: {
    eyebrow: 'Live operations workspace',
    title: 'Operations observatory',
    description: 'Real-time visibility across schedule, documentation, claims risk, and operational signals.',
    liveLabel: 'Live telemetry',
    tone: 'cyan'
  },
  schedule: {
    eyebrow: 'Live operations workspace',
    title: 'Temporal runway',
    description: 'Coordinate appointments, confirmations, clinician capacity, and check-ins in real time.',
    liveLabel: 'Live capacity',
    tone: 'cyan'
  },
  documentation: {
    eyebrow: 'Live operations workspace',
    title: 'Documentation continuum',
    description: 'Move every note from capture through review to signature and billing readiness.',
    liveLabel: 'Signature flow',
    tone: 'violet'
  },
  claims: {
    eyebrow: 'Live operations workspace',
    title: 'Risk constellation',
    description: 'Resolve validation, filing, and payer risk before it delays reimbursement.',
    liveLabel: 'Risk field live',
    tone: 'amber'
  },
  audit: {
    eyebrow: 'Live operations workspace',
    title: 'Event spectrum',
    description: 'Review immutable operational events and system signals across every workflow.',
    liveLabel: 'Observability live',
    tone: 'green'
  },
  settings: {
    eyebrow: 'Live operations workspace',
    title: 'Workspace parameters',
    description: 'Review demonstration boundaries, preferences, role access, and integration health.',
    liveLabel: 'Secure demo',
    tone: 'green'
  }
};

const CLINICIAN_LOAD: ClinicianLoad[] = [
  { name: 'Ava C.', utilization: 82 },
  { name: 'James M.', utilization: 74 },
  { name: 'Sarah L.', utilization: 91 },
  { name: 'Daniel W.', utilization: 68 },
  { name: 'Mia T.', utilization: 77 }
];

const SPECTRUM_HEIGHTS = [
  42, 54, 64, 48, 72, 76, 59, 44, 68, 79, 61, 50, 70, 64, 47, 55, 78, 82, 65, 52,
  58, 76, 71, 46, 54, 69, 84, 62, 48, 73, 88, 66, 52, 80, 74, 56, 49, 72, 83, 63,
  51, 68, 79, 58, 45, 65, 76, 61, 49, 70, 85, 66, 53, 74, 81, 60, 47, 67, 78, 55,
  44, 64, 73, 57, 49, 69, 82, 62, 51, 71, 77, 59
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css', './app.component.workspaces.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  private readonly http = inject(HttpClient);

  readonly nav = NAV_ITEMS;
  readonly activeView = signal<ViewId>('overview');
  readonly dashboard = signal<Dashboard>(createDemoDashboard());
  readonly loading = signal(true);
  readonly apiMode = signal<'connecting' | 'live' | 'demo'>('connecting');
  readonly notice = signal('');
  readonly selectedScheduleFilter = signal<'day' | 'week' | 'list'>('day');

  readonly view = computed(() => VIEW_META[this.activeView()]);
  readonly metrics = computed<MetricSignal[]>(() => buildMetricSignals(this.dashboard()));
  readonly pipeline = computed<PipelineStage[]>(() => buildPipelineStages(this.dashboard()));
  readonly riskDistribution = computed<RiskSlice[]>(() => buildRiskDistribution(this.dashboard()));
  readonly topClaims = computed(() => this.dashboard().claims.slice(0, 5));
  readonly auditEvents = computed(() => this.dashboard().audit.slice(0, 8));
  readonly noteQueue = computed<NoteQueueItem[]>(() =>
    this.dashboard().notes.slice(0, 6).map((note, index) => ({
      id: note.id,
      clinician: note.clinician,
      code: index % 2 === 0 ? '90837 · Individual therapy' : '90791 · Diagnostic evaluation',
      status: humanizeStatus(note.status),
      age: `${3 + index * 4}m`,
      tone: toneForStatus(note.status)
    }))
  );

  readonly clinicianLoad = CLINICIAN_LOAD;
  readonly spectrumBars = SPECTRUM_HEIGHTS;

  readonly runwayBlocks = computed<RunwayBlock[]>(() => {
    const source = this.dashboard().appointments;
    const layout = [
      [1, '2 / span 2'], [1, '4 / span 2'], [1, '7 / span 2'],
      [2, '2 / span 2'], [2, '5 / span 2'], [2, '8 / span 2'],
      [3, '3 / span 2'], [3, '5 / span 2'], [3, '8 / span 2'],
      [4, '2 / span 2'], [4, '4 / span 2'], [4, '7 / span 2'],
      [5, '3 / span 2'], [5, '5 / span 2'], [5, '8 / span 2'],
      [6, '2 / span 2'], [6, '4 / span 2'], [6, '7 / span 2']
    ] as const;

    return layout.map((placement, index) => {
      const appointment = source[index % source.length];
      const syntheticStatuses = ['Confirmed', 'InProgress', 'Scheduled', 'NoShow'];
      const status = appointment?.status ?? syntheticStatuses[index % syntheticStatuses.length];
      return {
        id: `${appointment?.id ?? 'runway'}-${index}`,
        patient: appointment?.patientDisplayName ?? 'Synthetic patient',
        clinician: appointment?.clinician ?? 'Clinical team',
        service: appointment?.service ?? 'Therapy session',
        status,
        time: `${8 + Math.floor(index / 3)}:${index % 2 === 0 ? '00' : '30'}`,
        row: placement[0],
        column: placement[1],
        tone: toneForStatus(status)
      };
    });
  });

  readonly providerRows = computed(() => {
    const clinicians = Array.from(new Set(this.dashboard().appointments.map(item => item.clinician)));
    return [...clinicians, 'Lunch break', 'Mia Torres', 'Chris Reed', 'Jordan Tate'].slice(0, 7);
  });

  readonly payerWatchlist = computed(() => {
    const grouped = new Map<string, number>();
    for (const claim of this.dashboard().claims) {
      grouped.set(claim.payer, (grouped.get(claim.payer) ?? 0) + claim.amount);
    }
    return [...grouped.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([payer, exposure], index) => ({
        payer,
        exposure,
        severity: index < 2 ? 'High' : index < 4 ? 'Medium' : 'Low',
        tone: index < 2 ? 'coral' : index < 4 ? 'amber' : 'green'
      }));
  });

  readonly recentClaimActions = computed(() =>
    this.dashboard().claims.slice(0, 5).map((claim, index) => ({
      claim,
      action: index === 0 ? 'Needs action' : index === 1 ? 'Resolved' : index === 2 ? 'Refiled' : index === 3 ? 'Updated' : 'Overturned',
      tone: index === 0 ? 'coral' : index === 3 ? 'cyan' : 'green',
      time: `${10 - Math.floor(index / 2)}:${18 - index * 3}`.replace(':-', ':0')
    }))
  );

  readonly eventTypeMetrics = computed<EventTypeMetric[]>(() => {
    const total = Math.max(1, this.dashboard().audit.length);
    const seeds = [
      ['Note signed', 2451, 'cyan'],
      ['Claim created', 2102, 'violet'],
      ['Claim status change', 1886, 'green'],
      ['Documentation updated', 1304, 'blue'],
      ['Outbox delivered', 1129, 'amber'],
      ['User or role change', 472, 'violet'],
      ['Integration error', 98, 'coral'],
      ['Security or access', 87, 'coral']
    ] as const;

    return seeds.map(([label, count, tone]) => ({
      label,
      count,
      share: `${((count / (9842 + total)) * 100).toFixed(1)}%`,
      tone
    }));
  });

  readonly auditSummary = [
    { label: 'Events today', value: '9,842', detail: '18% vs yesterday', tone: 'cyan' as const },
    { label: 'Signals / min', value: '68', detail: 'Live throughput', tone: 'violet' as const },
    { label: 'Error rate', value: '0.42%', detail: '0.12% vs yesterday', tone: 'amber' as const },
    { label: 'Delivery rate', value: '99.71%', detail: '0.18% vs yesterday', tone: 'green' as const },
    { label: 'Flagged events', value: '23', detail: '5 vs yesterday', tone: 'coral' as const },
    { label: 'Lag (p95)', value: '1.2s', detail: '0.3s vs yesterday', tone: 'cyan' as const }
  ];

  readonly waitlist = [
    { patient: 'Victoria N.', requested: '9:00 AM', opening: '10:30 Therapy Room 1' },
    { patient: 'Ryan J.', requested: '10:30 AM', opening: '12:30 Therapy Room 3' },
    { patient: 'Natalie Q.', requested: '1:00 PM', opening: '2:30 Telehealth' }
  ];

  readonly priorityFollowUps = [
    { label: 'Missing treatment plan', detail: 'Notes without an active plan', count: 23, tone: 'coral' as const },
    { label: 'Returned for correction', detail: 'Requires clinician updates', count: 14, tone: 'amber' as const },
    { label: 'Missing interventions', detail: 'No billable interventions documented', count: 11, tone: 'cyan' as const },
    { label: 'Dx / CPT mismatch', detail: 'Coding alignment needed', count: 6, tone: 'green' as const }
  ];

  readonly integrationHealth = [
    { name: 'EHR connector', detail: 'Synthetic EHR feed', state: 'Healthy', tone: 'cyan' as const },
    { name: 'Claims gateway', detail: 'Synthetic payer gateway', state: 'Healthy', tone: 'violet' as const },
    { name: 'Identity provider', detail: 'SSO enabled (SAML 2.0)', state: 'Healthy', tone: 'cyan' as const },
    { name: 'Notification service', detail: 'Email and in-app', state: 'Healthy', tone: 'violet' as const }
  ];

  readonly notificationPreferences = [
    { label: 'System alerts', cadence: 'Real-time', state: true },
    { label: 'Documentation updates', cadence: 'Digest (Daily)', state: true },
    { label: 'Claims and risk notifications', cadence: 'Real-time', state: true },
    { label: 'Schedule changes', cadence: 'Instant', state: true },
    { label: 'Team activity', cadence: 'Digest (Daily)', state: false }
  ];

  constructor() {
    this.load();
  }

  selectView(view: ViewId): void {
    this.activeView.set(view);
  }

  selectScheduleFilter(filter: 'day' | 'week' | 'list'): void {
    this.selectedScheduleFilter.set(filter);
  }

  load(): void {
    this.loading.set(true);
    this.apiMode.set('connecting');
    this.notice.set('');

    this.http.get<Dashboard>('/api/dashboard').subscribe({
      next: value => {
        this.dashboard.set(value);
        this.apiMode.set('live');
        this.loading.set(false);
      },
      error: () => {
        this.dashboard.set(createDemoDashboard());
        this.apiMode.set('demo');
        this.notice.set('API offline. Showing the complete local synthetic dataset.');
        this.loading.set(false);
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
    if (normalized.includes('flag') || normalized.includes('error')) return 'coral';
    if (normalized.includes('claim')) return 'amber';
    if (normalized.includes('note')) return 'violet';
    if (normalized.includes('appoint')) return 'cyan';
    return index % 2 === 0 ? 'green' : 'blue';
  }
}
