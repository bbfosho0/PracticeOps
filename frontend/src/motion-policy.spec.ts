import { metricMotionDuration, resolveMotionProfile } from './motion-policy';

describe('observatory motion policy', () => {
  it('disables authored motion for reduced-motion users', () => {
    const profile = resolveMotionProfile(true, false);

    expect(profile.enabled).toBeFalse();
    expect(profile.viewDuration).toBe(0);
    expect(profile.stagger).toBe(0);
    expect(profile.metricDuration).toBe(0);
    expect(profile.topologyDuration).toBe(0);
  });

  it('uses a tighter profile on compact viewports', () => {
    const desktop = resolveMotionProfile(false, false);
    const compact = resolveMotionProfile(false, true);

    expect(desktop.enabled).toBeTrue();
    expect(compact.enabled).toBeTrue();
    expect(compact.viewDuration).toBeLessThan(desktop.viewDuration);
    expect(compact.stagger).toBeLessThan(desktop.stagger);
    expect(compact.topologyDuration).toBeLessThan(desktop.topologyDuration);
  });

  it('bounds metric tween duration while reacting to larger changes', () => {
    const profile = resolveMotionProfile(false, false);
    const small = metricMotionDuration(10, 11, profile);
    const large = metricMotionDuration(10, 1000, profile);

    expect(small).toBeGreaterThanOrEqual(profile.metricDuration);
    expect(large).toBeGreaterThan(small);
    expect(large).toBeLessThanOrEqual(profile.metricDuration + 0.32);
  });

  it('returns zero metric duration when motion is disabled', () => {
    const profile = resolveMotionProfile(true, true);

    expect(metricMotionDuration(10, 100, profile)).toBe(0);
  });
});
