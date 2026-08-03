import { AfterViewInit, Directive, ElementRef, NgZone, OnDestroy } from '@angular/core';
import autoAnimate from '@formkit/auto-animate';

@Directive({
  selector: '[auto-animate]',
  standalone: true
})
export class AutoAnimateDirective implements AfterViewInit, OnDestroy {
  private controller?: { disable(): void };

  constructor(
    private readonly element: ElementRef<HTMLElement>,
    private readonly zone: NgZone
  ) {}

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.controller = autoAnimate(this.element.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.controller?.disable();
  }
}
