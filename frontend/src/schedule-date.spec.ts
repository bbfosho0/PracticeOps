import { Appointment } from './dashboard-model';
import { resolveInitialScheduleDate } from './schedule-date';

function appointment(startsAt: string): Appointment {
  return {
    id: 'appointment-1',
    patientDisplayName: 'Fictional patient',
    clinician: 'Fictional clinician',
    service: 'Fictional service',
    startsAt,
    status: 'Scheduled'
  };
}

describe('resolveInitialScheduleDate', () => {
  it('uses the authoritative appointment day when no reviewer date is selected', () => {
    const result = resolveInitialScheduleDate(
      [appointment('2026-08-04T08:00:00Z')],
      null,
      new Date('2026-08-03T23:30:00-05:00')
    );

    expect(result.getFullYear()).toBe(new Date('2026-08-04T08:00:00Z').getFullYear());
    expect(result.getMonth()).toBe(new Date('2026-08-04T08:00:00Z').getMonth());
    expect(result.getDate()).toBe(new Date('2026-08-04T08:00:00Z').getDate());
  });

  it('preserves an explicit reviewer-selected day across refreshes', () => {
    const selected = new Date('2026-08-08T16:00:00-05:00');

    const result = resolveInitialScheduleDate(
      [appointment('2026-08-04T08:00:00Z')],
      selected
    );

    expect(result.getFullYear()).toBe(selected.getFullYear());
    expect(result.getMonth()).toBe(selected.getMonth());
    expect(result.getDate()).toBe(selected.getDate());
    expect(result.getHours()).toBe(0);
  });

  it('uses the fallback day when the dataset is empty', () => {
    const fallback = new Date('2026-08-09T14:00:00-05:00');

    expect(resolveInitialScheduleDate([], null, fallback).getDate()).toBe(fallback.getDate());
  });
});
