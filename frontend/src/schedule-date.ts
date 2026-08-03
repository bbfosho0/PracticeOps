import { Appointment } from './dashboard-model';

function startOfDay(value: Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function resolveInitialScheduleDate(
  appointments: readonly Appointment[],
  selectedDate: Date | null,
  fallback = new Date()
): Date {
  if (selectedDate) return startOfDay(selectedDate);

  const firstAppointment = appointments[0]?.startsAt;
  if (!firstAppointment) return startOfDay(fallback);

  const parsed = new Date(firstAppointment);
  return Number.isNaN(parsed.getTime()) ? startOfDay(fallback) : startOfDay(parsed);
}
