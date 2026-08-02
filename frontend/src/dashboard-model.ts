export type ViewId = 'overview' | 'schedule' | 'documentation' | 'claims' | 'audit' | 'settings';
export type SignalTone = 'cyan' | 'violet' | 'amber' | 'green' | 'coral' | 'blue';

export interface DashboardMetrics {
  appointmentsToday: number;
  unsignedNotes: number;
  claimsAtRisk: number;
  claimExposure: number;
  teamUtilization: number;
}

export interface Appointment {
  id: string;
  patientDisplayName: string;
  clinician: string;
  service: string;
  startsAt: string;
  status: string;
}

export interface ClinicalNote {
  id: string;
  clinician: string;
  dueAt: string;
  status: string;
}

export interface Claim {
  id: string;
  number: string;
  payer: string;
  amount: number;
  riskReason: string;
  status: string;
}

export interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  summary: string;
  occurredAt: string;
}

export interface Dashboard {
  metrics: DashboardMetrics;
  appointments: Appointment[];
  notes: ClinicalNote[];
  claims: Claim[];
  audit: AuditEvent[];
}

export interface MetricSignal {
  label: string;
  value: number;
  suffix?: string;
  detail: string;
  tone: SignalTone;
  kind: 'integer' | 'currency' | 'percent' | 'duration';
}

export interface PipelineStage {
  label: string;
  description: string;
  value: number;
  tone: SignalTone;
}

export interface RiskSlice {
  label: string;
  count: number;
  exposure: number;
  tone: SignalTone;
}

const names = [
  ['Maya Johnson', 'Ava Chen', 'Initial assessment'],
  ['Ethan Brooks', 'James Monroe', 'Diagnostic evaluation'],
  ['Sophia Lee', 'Sarah Lin', 'Individual therapy'],
  ['Noah Carter', 'Daniel Ward', 'Medication follow-up'],
  ['Mia Thompson', 'Mia Torres', 'Individual therapy'],
  ['Chris Rivera', 'Chris Reed', 'Family therapy'],
  ['Jordan Taylor', 'Jordan Tate', 'Individual therapy'],
  ['Avery Wilson', 'Ava Chen', 'Care coordination']
] as const;

const claimSeeds = [
  ['CLM-742198', 'Blue Cross Blue Shield', 6380, 'Authorization required'],
  ['CLM-741552', 'Aetna', 4210, 'Coding mismatch'],
  ['CLM-741091', 'UnitedHealthcare', 3750, 'Timely filing risk'],
  ['CLM-740887', 'Cigna', 3120, 'Medical necessity documentation'],
  ['CLM-740673', 'Humana', 2860, 'Eligibility conflict'],
  ['CLM-740412', 'Blue Cross Blue Shield', 2380, 'Payer rule validation']
] as const;

function atTime(now: Date, hour: number, minute = 0): string {
  const value = new Date(now);
  value.setHours(hour, minute, 0, 0);
  return value.toISOString();
}

export function createDemoDashboard(now = new Date()): Dashboard {
  const appointmentStatuses = ['Completed', 'InSession', 'CheckedIn', 'Confirmed', 'Scheduled', 'Confirmed', 'Scheduled', 'Scheduled'];

  const appointments: Appointment[] = names.map((entry, index) => ({
    id: `demo-appointment-${index + 1}`,
    patientDisplayName: entry[0],
    clinician: entry[1],
    service: entry[2],
    startsAt: atTime(now, 8 + index, index % 2 === 0 ? 0 : 30),
    status: appointmentStatuses[index]
  }));

  const notes: ClinicalNote[] = [
    { id: 'demo-note-1', clinician: 'Ava Chen', dueAt: atTime(now, 9, 15), status: 'Signed' },
    { id: 'demo-note-2', clinician: 'James Monroe', dueAt: atTime(now, 10, 20), status: 'InReview' },
    { id: 'demo-note-3', clinician: 'Sarah Lin', dueAt: atTime(now, 10, 45), status: 'Draft' },
    { id: 'demo-note-4', clinician: 'Daniel Ward', dueAt: atTime(now, 11, 10), status: 'InReview' },
    { id: 'demo-note-5', clinician: 'Mia Torres', dueAt: atTime(now, 12, 0), status: 'Signed' },
    { id: 'demo-note-6', clinician: 'Chris Reed', dueAt: atTime(now, 13, 20), status: 'Draft' },
    { id: 'demo-note-7', clinician: 'Jordan Tate', dueAt: atTime(now, 14, 0), status: 'InReview' },
    { id: 'demo-note-8', clinician: 'Ava Chen', dueAt: atTime(now, 15, 10), status: 'Signed' },
    { id: 'demo-note-9', clinician: 'Sarah Lin', dueAt: atTime(now, 16, 0), status: 'Draft' },
    { id: 'demo-note-10', clinician: 'Daniel Ward', dueAt: atTime(now, 17, 0), status: 'Signed' }
  ];

  const claims: Claim[] = claimSeeds.map((entry, index) => ({
    id: `demo-claim-${index + 1}`,
    number: entry[0],
    payer: entry[1],
    amount: entry[2],
    riskReason: entry[3],
    status: 'NeedsReview'
  }));

  const auditActions = [
    ['Note signed', 'Ava Chen signed Maya Johnson’s progress note.'],
    ['Claim flagged', 'CLM-742198 entered the authorization risk queue.'],
    ['Appointment checked in', 'Ethan Brooks arrived for diagnostic evaluation.'],
    ['Claim updated', 'CLM-741552 coding validation was reviewed.'],
    ['Note moved to review', 'Sarah Lin submitted a draft for clinical review.'],
    ['Appointment confirmed', 'Noah Carter confirmed the medication follow-up.'],
    ['Outbox event delivered', 'ClaimStatusChanged was published to the topic exchange.'],
    ['Treatment plan linked', 'A current plan was linked to Sophia Lee’s note.']
  ] as const;

  const audit: AuditEvent[] = auditActions.map((entry, index) => ({
    id: `demo-audit-${index + 1}`,
    actor: index % 2 === 0 ? 'Clinical operations' : 'System',
    action: entry[0],
    summary: entry[1],
    occurredAt: atTime(now, 10, Math.max(0, 48 - index * 7))
  }));

  return {
    metrics: {
      appointmentsToday: 24,
      unsignedNotes: 7,
      claimsAtRisk: 12,
      claimExposure: 54280,
      teamUtilization: 86
    },
    appointments,
    notes,
    claims,
    audit
  };
}

export function humanizeStatus(status: string): string {
  return status
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

export function initials(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function toneForStatus(status: string): SignalTone {
  const normalized = status.toLowerCase();
  if (normalized.includes('complete') || normalized.includes('signed') || normalized.includes('paid') || normalized.includes('confirm')) return 'green';
  if (normalized.includes('review') || normalized.includes('session') || normalized.includes('checked')) return 'cyan';
  if (normalized.includes('draft') || normalized.includes('scheduled')) return 'violet';
  if (normalized.includes('denied') || normalized.includes('cancel') || normalized.includes('risk')) return 'coral';
  return 'blue';
}

export function buildMetricSignals(dashboard: Dashboard): MetricSignal[] {
  return [
    {
      label: 'Appointments today',
      value: dashboard.metrics.appointmentsToday,
      detail: '12% vs yesterday',
      tone: 'cyan',
      kind: 'integer'
    },
    {
      label: 'Unsigned notes',
      value: dashboard.metrics.unsignedNotes,
      detail: '2 overdue',
      tone: 'violet',
      kind: 'integer'
    },
    {
      label: 'Claims at risk',
      value: dashboard.metrics.claimsAtRisk,
      detail: `${formatCompactCurrency(dashboard.metrics.claimExposure)} exposure`,
      tone: 'amber',
      kind: 'integer'
    },
    {
      label: 'Team utilization',
      value: dashboard.metrics.teamUtilization,
      suffix: '%',
      detail: '6% vs last week',
      tone: 'green',
      kind: 'percent'
    }
  ];
}

export function buildPipelineStages(dashboard: Dashboard): PipelineStage[] {
  const draft = dashboard.notes.filter(note => note.status === 'Draft').length;
  const review = dashboard.notes.filter(note => note.status === 'InReview').length;
  const signed = dashboard.notes.filter(note => note.status === 'Signed').length;

  return [
    { label: 'Capture', description: 'Note in progress', value: 197 + draft, tone: 'blue' },
    { label: 'Review', description: 'Clinician review', value: 115 + review, tone: 'violet' },
    { label: 'Signature', description: 'Awaiting signature', value: dashboard.metrics.unsignedNotes, tone: 'amber' },
    { label: 'Final QA', description: 'Ready for billing', value: 172 + signed, tone: 'cyan' },
    { label: 'Billing ready', description: 'Sent to billing', value: 138 + signed, tone: 'green' }
  ];
}

export function riskCategory(reason: string): RiskSlice['label'] {
  const normalized = reason.toLowerCase();
  if (normalized.includes('auth')) return 'Authorization';
  if (normalized.includes('coding') || normalized.includes('code')) return 'Coding';
  if (normalized.includes('timely') || normalized.includes('filing')) return 'Timely filing';
  if (normalized.includes('medical') || normalized.includes('documentation')) return 'Medical necessity';
  return 'Payer rules';
}

export function buildRiskDistribution(dashboard: Dashboard): RiskSlice[] {
  const tones: Record<RiskSlice['label'], SignalTone> = {
    Authorization: 'blue',
    Coding: 'violet',
    'Timely filing': 'coral',
    'Medical necessity': 'cyan',
    'Payer rules': 'amber'
  };

  const grouped = new Map<RiskSlice['label'], RiskSlice>();
  for (const claim of dashboard.claims) {
    const label = riskCategory(claim.riskReason);
    const current = grouped.get(label) ?? { label, count: 0, exposure: 0, tone: tones[label] };
    current.count += 1;
    current.exposure += claim.amount;
    grouped.set(label, current);
  }

  return (['Payer rules', 'Authorization', 'Coding', 'Medical necessity', 'Timely filing'] as const)
    .map(label => grouped.get(label) ?? { label, count: 0, exposure: 0, tone: tones[label] });
}

export function formatCompactCurrency(amount: number): string {
  if (amount >= 1000) {
    const compact = amount / 1000;
    return `$${compact.toFixed(compact >= 10 ? 1 : 2).replace(/\.0$/, '')}k`;
  }
  return `$${Math.round(amount)}`;
}

export function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}
