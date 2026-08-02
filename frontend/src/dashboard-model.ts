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

const patients = [
  'Maya Johnson', 'Ethan Brooks', 'Sophia Lee', 'Noah Carter', 'Mia Thompson', 'Chris Rivera',
  'Jordan Taylor', 'Avery Wilson', 'Olivia Martin', 'Liam Davis', 'Emma Clark', 'Lucas Hall',
  'Amelia Lewis', 'Henry Walker', 'Harper Young', 'Elijah King', 'Evelyn Wright', 'Mateo Scott',
  'Camila Green', 'Sebastian Adams', 'Luna Baker', 'Daniel Nelson', 'Sofia Hill', 'Leo Mitchell'
] as const;

const clinicians = ['Ava Chen', 'James Monroe', 'Sarah Lin', 'Daniel Ward'] as const;
const services = [
  'Initial assessment',
  'Diagnostic evaluation',
  'Individual therapy',
  'Medication follow-up',
  'Family therapy',
  'Care coordination'
] as const;

const claimSeeds = [
  ['CLM-742198', 'Blue Cross Blue Shield', 6380, 'Authorization required'],
  ['CLM-741552', 'Aetna', 4210, 'Coding mismatch'],
  ['CLM-741091', 'UnitedHealthcare', 3750, 'Timely filing risk'],
  ['CLM-740887', 'Cigna', 3120, 'Medical necessity documentation'],
  ['CLM-740673', 'Humana', 2860, 'Eligibility conflict'],
  ['CLM-740412', 'Blue Cross Blue Shield', 2380, 'Payer rule validation'],
  ['CLM-740103', 'Aetna', 7250, 'Authorization expired'],
  ['CLM-739944', 'UnitedHealthcare', 6980, 'Medical necessity review'],
  ['CLM-739801', 'Cigna', 5640, 'Coding mismatch'],
  ['CLM-739677', 'Humana', 4980, 'Timely filing deadline'],
  ['CLM-739522', 'Blue Cross Blue Shield', 3750, 'Payer rule validation'],
  ['CLM-739408', 'Aetna', 2980, 'Eligibility conflict']
] as const;

function atTime(now: Date, hour: number, minute = 0): string {
  const value = new Date(now);
  value.setHours(hour, minute, 0, 0);
  return value.toISOString();
}

function hoursFrom(now: Date, hours: number): string {
  return new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
}

function sameLocalDay(value: string, reference: Date): boolean {
  const date = new Date(value);
  return date.getFullYear() === reference.getFullYear()
    && date.getMonth() === reference.getMonth()
    && date.getDate() === reference.getDate();
}

function deriveMetrics(
  appointments: Appointment[],
  notes: ClinicalNote[],
  claims: Claim[],
  referenceDate: Date
): DashboardMetrics {
  const todaysAppointments = appointments.filter(item => sameLocalDay(item.startsAt, referenceDate));
  const activeAppointments = todaysAppointments.filter(item => !['Cancelled', 'NoShow'].includes(item.status));
  const uniqueClinicians = new Set(todaysAppointments.map(item => item.clinician)).size;
  const capacity = uniqueClinicians * 7;
  const atRiskClaims = claims.filter(item => ['NeedsReview', 'Denied'].includes(item.status));

  return {
    appointmentsToday: todaysAppointments.length,
    unsignedNotes: notes.filter(item => item.status !== 'Signed').length,
    claimsAtRisk: atRiskClaims.length,
    claimExposure: atRiskClaims.reduce((sum, item) => sum + item.amount, 0),
    teamUtilization: capacity === 0 ? 0 : clampPercent(Math.round((activeAppointments.length / capacity) * 100))
  };
}

export function createDemoDashboard(now = new Date()): Dashboard {
  const appointmentStatuses = [
    'Completed', 'Completed', 'Completed', 'Completed',
    'InSession', 'InSession',
    'CheckedIn', 'CheckedIn',
    'Confirmed', 'Confirmed', 'Confirmed', 'Confirmed', 'Confirmed',
    'Confirmed', 'Confirmed', 'Confirmed', 'Confirmed', 'Confirmed',
    'Scheduled', 'Scheduled', 'Scheduled', 'Scheduled', 'Scheduled', 'Scheduled'
  ];

  const appointments: Appointment[] = patients.map((patient, index) => ({
    id: `demo-appointment-${index + 1}`,
    patientDisplayName: patient,
    clinician: clinicians[index % clinicians.length],
    service: services[index % services.length],
    startsAt: atTime(now, 8 + Math.floor(index / 3), (index % 3) * 20),
    status: appointmentStatuses[index]
  }));

  const unsignedDueOffsets = [-1, -3, -8, -14, -22, -30, -48];
  const notes: ClinicalNote[] = appointments.map((appointment, index) => {
    const status = index < 17 ? 'Signed' : index < 20 ? 'InReview' : 'Draft';
    const dueAt = status === 'Signed'
      ? hoursFrom(now, -Math.max(1, 24 - index))
      : hoursFrom(now, unsignedDueOffsets[index - 17]);

    return {
      id: `demo-note-${index + 1}`,
      clinician: appointment.clinician,
      dueAt,
      status
    };
  });

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
    ['Treatment plan linked', 'A current plan was linked to Sophia Lee’s note.'],
    ['Security review completed', 'Role access review completed with no exceptions.'],
    ['Claim denied', 'CLM-740887 requires medical necessity documentation.'],
    ['Appointment completed', 'Mia Thompson completed an individual therapy session.'],
    ['Notification delivered', 'The reminder queue delivered the scheduled patient notices.']
  ] as const;

  const audit: AuditEvent[] = auditActions.map((entry, index) => ({
    id: `demo-audit-${index + 1}`,
    actor: index % 3 === 0 ? 'Clinical operations' : index % 3 === 1 ? 'System' : 'Revenue cycle',
    action: entry[0],
    summary: entry[1],
    occurredAt: new Date(now.getTime() - index * 7 * 60 * 1000).toISOString()
  }));

  return {
    metrics: deriveMetrics(appointments, notes, claims, now),
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
  if (normalized.includes('denied') || normalized.includes('cancel') || normalized.includes('risk') || normalized.includes('no show')) return 'coral';
  return 'blue';
}

export function buildMetricSignals(dashboard: Dashboard): MetricSignal[] {
  const confirmed = dashboard.appointments.filter(item => item.status === 'Confirmed').length;
  const checkedIn = dashboard.appointments.filter(item => ['CheckedIn', 'InSession'].includes(item.status)).length;
  const overdue = dashboard.notes.filter(item => item.status !== 'Signed' && new Date(item.dueAt).getTime() < Date.now()).length;
  const uniqueClinicians = new Set(dashboard.appointments.map(item => item.clinician)).size;
  const capacity = uniqueClinicians * 7;

  return [
    {
      label: 'Appointments today',
      value: dashboard.metrics.appointmentsToday,
      detail: `${confirmed} confirmed · ${checkedIn} active`,
      tone: 'cyan',
      kind: 'integer'
    },
    {
      label: 'Unsigned notes',
      value: dashboard.metrics.unsignedNotes,
      detail: `${overdue} overdue`,
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
      detail: `${dashboard.metrics.appointmentsToday}/${capacity} active slots`,
      tone: 'green',
      kind: 'percent'
    }
  ];
}

export function buildPipelineStages(dashboard: Dashboard): PipelineStage[] {
  const draft = dashboard.notes.filter(note => note.status === 'Draft').length;
  const review = dashboard.notes.filter(note => note.status === 'InReview').length;
  const signed = dashboard.notes.filter(note => note.status === 'Signed').length;
  const total = dashboard.notes.length;

  return [
    { label: 'Capture', description: 'All captured notes', value: total, tone: 'blue' },
    { label: 'Review', description: 'Open documentation', value: draft + review, tone: 'violet' },
    { label: 'Signature', description: 'Awaiting signature', value: review, tone: 'amber' },
    { label: 'Final QA', description: 'Signed and complete', value: signed, tone: 'cyan' },
    { label: 'Billing ready', description: 'Ready for billing', value: signed, tone: 'green' }
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
  for (const claim of dashboard.claims.filter(item => ['NeedsReview', 'Denied'].includes(item.status))) {
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
