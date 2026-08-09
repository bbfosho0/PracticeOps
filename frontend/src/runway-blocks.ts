import { SignalTone, toneForStatus } from './dashboard-model';

export interface RunwayBlockInput { readonly id: string; readonly patientDisplayName: string; readonly clinician: string; readonly service: string; readonly status: string; readonly startsAt: string; }
export interface RunwayBlock { readonly id: string; readonly patient: string; readonly clinician: string; readonly service: string; readonly status: string; readonly time: string; readonly row: number; readonly lane: number; readonly laneCount: number; readonly column: string; readonly tone: SignalTone; }

export function buildRunwayBlocks(appointments: readonly RunwayBlockInput[], providerNames: readonly string[]): RunwayBlock[] {
  const source = appointments.slice(0, 18);
  const occupied = new Map<number, { end: number; lane: number }[]>();
  const blocks = source.map(appointment => {
    const start = new Date(appointment.startsAt);
    const offset = Math.max(0, Math.min(9, start.getHours() - 8));
    const span = appointment.service.toLowerCase().includes('assessment') ? 2 : 1;
    const index = providerNames.indexOf(appointment.clinician);
    const row = Math.min(7, index >= 0 ? index + 1 : 1);
    const lanes = occupied.get(row) ?? [];
    let lane = 0;
    while (lanes.some(item => item.lane === lane && item.end > offset)) lane++;
    lanes.push({ end: offset + span, lane });
    occupied.set(row, lanes);
    return { appointment, start, offset, span, row, lane };
  });
  return blocks.map(({ appointment, start, offset, span, row, lane }) => ({
    id: appointment.id, patient: appointment.patientDisplayName, clinician: appointment.clinician,
    service: appointment.service, status: appointment.status,
    time: start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), row, lane,
    laneCount: Math.max(...blocks.filter(block => block.row === row).map(block => block.lane)) + 1,
    column: `${offset + 1} / span ${span}`, tone: toneForStatus(appointment.status)
  }));
}
