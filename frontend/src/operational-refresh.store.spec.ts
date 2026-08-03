import { relativeRefreshLabel, shouldPollOperationalData } from './operational-refresh.store';

describe('Operational refresh policy', () => {
  it('polls only for visible live API data', () => {
    expect(shouldPollOperationalData('live', false)).toBeTrue();
    expect(shouldPollOperationalData('live', true)).toBeFalse();
    expect(shouldPollOperationalData('demo', false)).toBeFalse();
    expect(shouldPollOperationalData('connecting', false)).toBeFalse();
  });

  it('formats truthful relative refresh labels', () => {
    const now = new Date('2026-08-03T12:00:00Z');

    expect(relativeRefreshLabel(new Date('2026-08-03T11:59:55Z'), now)).toBe('Updated just now');
    expect(relativeRefreshLabel(new Date('2026-08-03T11:59:28Z'), now)).toBe('Updated 32 seconds ago');
    expect(relativeRefreshLabel(new Date('2026-08-03T11:57:00Z'), now)).toBe('Updated 3 minutes ago');
  });
});
