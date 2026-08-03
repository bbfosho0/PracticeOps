export interface MotionProfile {
  enabled: boolean;
  viewDuration: number;
  stagger: number;
  metricDuration: number;
  topologyDuration: number;
  travel: number;
}

export function resolveMotionProfile(reducedMotion: boolean, compactViewport: boolean): MotionProfile {
  if (reducedMotion) {
    return {
      enabled: false,
      viewDuration: 0,
      stagger: 0,
      metricDuration: 0,
      topologyDuration: 0,
      travel: 0
    };
  }

  if (compactViewport) {
    return {
      enabled: true,
      viewDuration: 0.26,
      stagger: 0.028,
      metricDuration: 0.38,
      topologyDuration: 0.42,
      travel: 12
    };
  }

  return {
    enabled: true,
    viewDuration: 0.34,
    stagger: 0.045,
    metricDuration: 0.48,
    topologyDuration: 0.58,
    travel: 18
  };
}

export function metricMotionDuration(from: number, to: number, profile: MotionProfile): number {
  if (!profile.enabled) return 0;
  const magnitude = Math.abs(to - from);
  return profile.metricDuration + Math.min(0.32, Math.log10(magnitude + 1) * 0.1);
}
