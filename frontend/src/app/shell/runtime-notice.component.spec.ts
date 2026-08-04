import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RuntimeNoticeComponent } from './runtime-notice.component';

describe('RuntimeNoticeComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));

  function render(mode: 'connecting' | 'live' | 'demo', retryAvailable = true, stale = false) {
    const fixture = TestBed.createComponent(RuntimeNoticeComponent);
    fixture.componentRef.setInput('mode', mode);
    fixture.componentRef.setInput('notice', 'Synthetic preview — API unavailable.');
    fixture.componentRef.setInput('stale', stale);
    fixture.componentRef.setInput('retryAvailable', retryAvailable);
    fixture.detectChanges();
    return fixture;
  }

  it('labels the demo recovery action and emits retry requests', () => {
    const fixture = render('demo');
    let retries = 0;
    fixture.componentInstance.retryRequested.subscribe(() => retries++);
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(button.textContent?.trim()).toBe('Retry API');
    button.click();
    expect(retries).toBe(1);
  });

  it('uses a polite live region and exposes stale and unavailable states', () => {
    const host = render('live', false, true).nativeElement as HTMLElement;
    const button = host.querySelector('button') as HTMLButtonElement;

    expect(host.getAttribute('aria-live')).toBe('polite');
    expect(host.classList).toContain('is-stale');
    expect(button.textContent?.trim()).toBe('Refresh now');
    expect(button.disabled).toBeTrue();
  });
});
