import { Directive, ElementRef, Input, NgZone, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { gsap } from 'gsap';
import { ViewId } from './dashboard-model';
import { resolveMotionProfile } from './motion-policy';

const PERSISTENT_SURFACES = new Set([
  'workspace-header',
  'mode-notice',
  'scenario-rail',
  'portfolio-proof',
  'sr-only'
]);

@Directive({
  selector: '[appObservatoryViewMotion]',
  standalone: true
})
export class ObservatoryViewMotionDirective implements OnChanges, OnDestroy {
  @Input('appObservatoryViewMotion') view: ViewId = 'overview';

  private timeline?: gsap.core.Timeline;
  private frameId?: number;

  constructor(
    private readonly element: ElementRef<HTMLElement>,
    private readonly zone: NgZone
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['view']) return;
    this.scheduleAnimation();
  }

  ngOnDestroy(): void {
    if (this.frameId !== undefined) cancelAnimationFrame(this.frameId);
    this.timeline?.kill();
    gsap.killTweensOf(this.targets());
  }

  private scheduleAnimation(): void {
    if (this.frameId !== undefined) cancelAnimationFrame(this.frameId);
    this.zone.runOutsideAngular(() => {
      this.frameId = requestAnimationFrame(() => {
        this.frameId = undefined;
        this.animateCurrentView();
      });
    });
  }

  private animateCurrentView(): void {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const compactViewport = window.matchMedia('(max-width: 760px)').matches;
    const profile = resolveMotionProfile(reducedMotion, compactViewport);
    const headerTargets = Array.from(this.element.nativeElement.querySelectorAll<HTMLElement>('.header-copy > *'));
    const surfaceTargets = this.currentViewSurfaces();
    const allTargets = [...headerTargets, ...surfaceTargets];

    this.timeline?.kill();
    gsap.killTweensOf(allTargets);

    if (!profile.enabled) {
      gsap.set(allTargets, { clearProps: 'opacity,transform' });
      return;
    }

    this.timeline = gsap.timeline({ defaults: { overwrite: true } });
    this.timeline.fromTo(
      headerTargets,
      { opacity: 0, y: Math.max(5, profile.travel * 0.42) },
      {
        opacity: 1,
        y: 0,
        duration: profile.viewDuration * 0.72,
        stagger: profile.stagger,
        ease: 'power3.out',
        clearProps: 'opacity,transform'
      }
    );
    this.timeline.fromTo(
      surfaceTargets,
      { opacity: 0, y: profile.travel, scale: 0.992 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: profile.viewDuration,
        stagger: profile.stagger,
        ease: 'power3.out',
        clearProps: 'opacity,transform'
      },
      '<0.06'
    );
  }

  private currentViewSurfaces(): HTMLElement[] {
    return Array.from(this.element.nativeElement.children)
      .filter((child): child is HTMLElement => child instanceof HTMLElement)
      .filter(child => !Array.from(PERSISTENT_SURFACES).some(className => child.classList.contains(className)));
  }

  private targets(): HTMLElement[] {
    return [
      ...Array.from(this.element.nativeElement.querySelectorAll<HTMLElement>('.header-copy > *')),
      ...this.currentViewSurfaces()
    ];
  }
}
