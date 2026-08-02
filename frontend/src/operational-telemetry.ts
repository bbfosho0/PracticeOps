import {
  AuditEvent,
  Dashboard,
  DashboardMetrics,
  SignalTone,
  clampPercent,
  humanizeStatus,
  toneForStatus
} from './dashboard-model';

export interface ClinicianLoadMetric {
  name: string;
  appointments: number;
  capacity: number;
  utilization: number;
}

export interface ScheduleTelemetry {
  appointments: number;
  confirmed: number;
  checkedIn: number;
  inSession: number;
  completed: number;
  scheduled: number;
  noShowRisk: number;
  capacityPercent: number;
  availableSlots: number;
  reminders: {
    text: number;
    email: number;
    call: number;
    total: number;
  };
}

export interface DocumentationTelemetry {
  total: number;
  signed: number;
  unsigned: number;
  draft: number;
  inReview: number;
  overdue: number;
  completionRate: number;
  returnedRate: number;
  averageAgeHours: number;
  ageBuckets: {
    underFourHours: number;
    fourToTwentyFourHours: number;
    overTwentyFourHours: number;
  };
  clinicianBacklog: Array<{
    clinician: string;
    count: number;
    oldestAgeHours: number;
    utilization: number;
  }>;
}

export interface AuditCategoryMetric {
  label: string;
  count: number;
  share: number;
  tone: SignalTone;
}

export interface AuditTelemetry {
  eventsToday: number;
  flaggedEvents: number;
  deliveryEvents: number;
  errorRate: number;
  deliveryRate: number;
  signalsPerMinute: number;
  lagP95Seconds: number;
  categories: AuditCategoryMetric[];
  spectrum: number[];
}

const DAILY_CLINICIAN_CAPACITY = 7;
const AT_RISK_CLAIM_STATUSES = new Set(['NeedsReview', 'Denied']);
const ACTIVE_APPOINTMENT_STATUSES = new Set(['Scheduled', 'Confirmed', 'CheckedIn', 'InSession', 'Completed']);

function sameLocalDay(value: string, referenceDate: Date): boolean {
  const date = new Date(value);
  return date.getFullYear() === referenceDate.getFullYear()
    && date.getMonth() === referenceDate.getMonth()
    && date.getDate() === referenceDate.getDate();
}

function appointmentsForDate(dashboard: Dashboard, referenceDate: Date) {
  return dashboard.appointments.filter(item => sameLocalDay(item.startsAt, referenceDate));
}

function deriveMetrics(dashboard: Dashboard, referenceDate: Date): DashboardMetrics {
  const appointments = appointmentsForDate(dashboard, referenceDate);
  const activeAppointments = appointments.filter(item => ACTIVE_APPOINTMENT_STATUSES.has(item.status));
  const uniqueClinicians = new Set(appointments.map(item => item.clinician)).size;
  const capacity = uniqueClinicians * DAILY_CLINICIAN_CAPACITY;
  const atRiskClaims = dashboard.claims.filter(item => AT_RISK_CLAIM_STATUSES.has(item.status));

  return {
    appointmentsToday: appointments.length,
    unsignedNotes: dashboard.notes.filter(item => item.status !== 'Signed').length,
    claimsAtRisk: atRiskClaims.length,
    claimExposure: atRiskClaims.reduce((sum, item) => sum + item.amount, 0),
    teamUtilization: capacity === 0
      ? 0
      : clampPercent(Math.round((activeAppointments.length / capacity) * 100))
  };
}

export function reconcileDashboard(dashboard: Dashboard, referenceDate = new Date()): Dashboard {
  return {
    ...dashboard,
    metrics: deriveMetrics(dashboard, referenceDate),
    appointments: [...dashboard.appointments].sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    notes: [...dashboard.notes].sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
    claims: [...dashboard.claims].sort((a, b) => b.amount - a.amount),
    audit: [...dashboard.audit].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
  };
}

export function buildClinicianLoad(dashboard: Dashboard, referenceDate = new Date()): ClinicianLoadMetric[] {
  const grouped = new Map<string, number>();
  for (const appointment of appointmentsForDate(dashboard, referenceDate)) {
    if (!ACTIVE_APPOINTMENT_STATUSES.has(appointment.status)) continue;
    grouped.set(appointment.clinician, (grouped.get(appointment.clinician) ?? 0) + 1);
  }

  return [...grouped.entries()]
    .map(([name, appointments]) => ({
      name,
      appointments,
      capacity: DAILY_CLINICIAN_CAPACITY,
      utilization: clampPercent(Math.round((appointments / DAILY_CLINICIAN_CAPACITY) * 100))
    }))
    .sort((a, b) => b.utilization - a.utilization || a.name.localeCompare(b.name));
}

export function buildScheduleTelemetry(dashboard: Dashboard, referenceDate = new Date()): ScheduleTelemetry {
  const appointments = appointmentsForDate(dashboard, referenceDate);
  const count = (status: string) => appointments.filter(item => item.status === status).length;
  const scheduled = count('Scheduled');
  const confirmed = count('Confirmed');
  const checkedIn = count('CheckedIn');
  const inSession = count('InSession');
  const completed = count('Completed');
  const noShowCount = appointments.filter(item => ['NoShow', 'Cancelled'].includes(item.status)).length;
  const clinicians = new Set(appointments.map(item => item.clinician)).size;
  const capacity = clinicians * DAILY_CLINICIAN_CAPACITY;
  const active = appointments.filter(item => ACTIVE_APPOINTMENT_STATUSES.has(item.status)).length;
  const call = noShowCount + Math.max(0, scheduled - Math.floor(scheduled / 2));
  const text = Math.floor(scheduled / 2);
  const email = confirmed;

  return {
    appointments: appointments.length,
    confirmed,
    checkedIn,
    inSession,
    completed,
    scheduled,
    noShowRisk: appointments.length === 0 ? 0 : Math.round(((scheduled + noShowCount) / appointments.length) * 100),
    capacityPercent: capacity === 0 ? 0 : clampPercent(Math.round((active / capacity) * 100)),
    availableSlots: Math.max(0, capacity - active),
    reminders: {
      text,
      email,
      call,
      total: text + email + call
    }
  };
}

export function buildDocumentationTelemetry(dashboard: Dashboard, referenceDate = new Date()): DocumentationTelemetry {
  const signed = dashboard.notes.filter(item => item.status === 'Signed').length;
  const draft = dashboard.notes.filter(item => item.status === 'Draft').length;
  const inReview = dashboard.notes.filter(item => item.status === 'InReview').length;
  const unsignedNotes = dashboard.notes.filter(item => item.status !== 'Signed');
  const ages = unsignedNotes.map(item => Math.max(0, (referenceDate.getTime() - new Date(item.dueAt).getTime()) / 3_600_000));
  const grouped = new Map<string, number[]>();

  unsignedNotes.forEach((note, index) => {
    const current = grouped.get(note.clinician) ?? [];
    current.push(ages[index]);
    grouped.set(note.clinician, current);
  });

  const clinicianBacklog = [...grouped.entries()]
    .map(([clinician, noteAges]) => ({
      clinician,
      count: noteAges.length,
      oldestAgeHours: Math.round(Math.max(...noteAges, 0) * 10) / 10,
      utilization: clampPercent(Math.round((noteAges.length / Math.max(1, dashboard.metrics.unsignedNotes)) * 100))
    }))
    .sort((a, b) => b.count - a.count || b.oldestAgeHours - a.oldestAgeHours);

  return {
    total: dashboard.notes.length,
    signed,
    unsigned: unsignedNotes.length,
    draft,
    inReview,
    overdue: ages.filter(age => age > 0).length,
    completionRate: dashboard.notes.length === 0 ? 0 : Math.round((signed / dashboard.notes.length) * 100),
    returnedRate: dashboard.notes.length === 0 ? 0 : Math.round((draft / dashboard.notes.length) * 100),
    averageAgeHours: ages.length === 0 ? 0 : Math.round((ages.reduce((sum, age) => sum + age, 0) / ages.length) * 10) / 10,
    ageBuckets: {
      underFourHours: ages.filter(age => age < 4).length,
      fourToTwentyFourHours: ages.filter(age => age >= 4 && age <= 24).length,
      overTwentyFourHours: ages.filter(age => age > 24).length
    },
    clinicianBacklog
  };
}

function auditCategory(event: AuditEvent): { label: string; tone: SignalTone } {
  const text = `${event.action} ${event.summary}`.toLowerCase();
  if (text.includes('security') || text.includes('access') || text.includes('role')) return { label: 'Security and access', tone: 'coral' };
  if (text.includes('deliver') || text.includes('outbox') || text.includes('publish')) return { label: 'Delivery and integration', tone: 'amber' };
  if (text.includes('claim')) return { label: 'Claims', tone: 'green' };
  if (text.includes('note') || text.includes('documentation') || text.includes('treatment plan')) return { label: 'Documentation', tone: 'violet' };
  if (text.includes('appointment') || text.includes('schedule')) return { label: 'Appointments', tone: 'cyan' };
  return { label: 'Workspace', tone: 'blue' };
}

function eventHash(event: AuditEvent): number {
  const value = `${event.id}|${event.actor}|${event.action}|${event.summary}`;
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

export function buildAuditTelemetry(dashboard: Dashboard): AuditTelemetry {
  const grouped = new Map<string, { label: string; count: number; tone: SignalTone }>();
  for (const event of dashboard.audit) {
    const category = auditCategory(event);
    const current = grouped.get(category.label) ?? { ...category, count: 0 };
    current.count += 1;
    grouped.set(category.label, current);
  }

  const total = dashboard.audit.length;
  const categories = [...grouped.values()]
    .map(item => ({
      ...item,
      share: total === 0 ? 0 : Math.round((item.count / total) * 1000) / 10
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const flaggedEvents = dashboard.audit.filter(event => /flag|denied|error|security|exception/i.test(`${event.action} ${event.summary}`)).length;
  const deliveryEvents = dashboard.audit.filter(event => /deliver|outbox|publish/i.test(`${event.action} ${event.summary}`)).length;
  const spectrumSource = dashboard.audit.length === 0
    ? [{ id: 'empty', actor: 'System', action: 'No events', summary: 'No audit activity', occurredAt: new Date(0).toISOString() }]
    : dashboard.audit;
  const spectrum = Array.from({ length: 72 }, (_, index) => {
    const event = spectrumSource[index % spectrumSource.length];
    return 20 + ((eventHash(event) + index * 17) % 77);
  });

  return {
    eventsToday: total,
    flaggedEvents,
    deliveryEvents,
    errorRate: total === 0 ? 0 : Math.round((flaggedEvents / total) * 10_000) / 100,
    deliveryRate: total === 0 ? 100 : Math.round(((total - flaggedEvents) / total) * 10_000) / 100,
    signalsPerMinute: total === 0 ? 0 : Math.max(1, Math.round(total / 8)),
    lagP95Seconds: total === 0 ? 0 : Math.round((0.4 + flaggedEvents * 0.18 + deliveryEvents * 0.05) * 10) / 10,
    categories,
    spectrum
  };
}

export function actionLabel(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized.includes('paid')) return 'Paid';
  if (normalized.includes('denied')) return 'Denied';
  if (normalized.includes('review')) return 'Needs action';
  if (normalized.includes('submitted')) return 'Submitted';
  return humanizeStatus(status);
}

export function actionTone(status: string): SignalTone {
  return toneForStatus(status);
}
