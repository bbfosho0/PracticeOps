import { resolveAtmosphereState } from './atmosphere-renderer';

describe('AtmosphereRenderer state resolution', () => {
  it('uses the CSS fallback when WebGL2 is unavailable', () => {
    expect(resolveAtmosphereState({ webglAvailable: false, reducedMotion: false, hidden: false })).toBe('fallback');
  });

  it('disables the animated passthrough for reduced motion', () => {
    expect(resolveAtmosphereState({ webglAvailable: true, reducedMotion: true, hidden: false })).toBe('reduced');
  });

  it('pauses rendering in a hidden tab and resumes when visible', () => {
    expect(resolveAtmosphereState({ webglAvailable: true, reducedMotion: false, hidden: true })).toBe('paused');
    expect(resolveAtmosphereState({ webglAvailable: true, reducedMotion: false, hidden: false })).toBe('active');
  });
});
