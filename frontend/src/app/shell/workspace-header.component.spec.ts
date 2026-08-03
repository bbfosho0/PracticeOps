import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { WorkspaceHeaderComponent, WorkspaceViewMetadata } from './workspace-header.component';

describe('WorkspaceHeaderComponent', () => {
  const metadata: WorkspaceViewMetadata = {
    eyebrow: 'Operational command workspace',
    title: 'Risk constellation',
    description: 'Resolve fictional claim risk.',
    liveLabel: 'Claim state',
    tone: 'amber'
  };

  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));

  function render(refreshing = false) {
    const fixture = TestBed.createComponent(WorkspaceHeaderComponent);
    fixture.componentRef.setInput('metadata', metadata);
    fixture.componentRef.setInput('runtimeStatus', { label: 'Live API', tone: 'green' });
    fixture.componentRef.setInput('updatedLabel', 'Updated just now');
    fixture.componentRef.setInput('refreshing', refreshing);
    fixture.detectChanges();
    return fixture;
  }

  it('renders workspace metadata and the truthful runtime status', () => {
    const host = render().nativeElement as HTMLElement;

    expect(host.querySelector('h1')?.textContent).toContain('Risk constellation');
    expect(host.querySelector('.live-pill')?.textContent).toContain('Live API');
    expect(host.querySelector('.live-pill')?.getAttribute('data-tone')).toBe('green');
    expect(host.querySelector('.demo-pill')?.textContent).toContain('Updated just now');
  });

  it('provides accessible names and emits refresh requests when available', () => {
    const fixture = render();
    let refreshes = 0;
    fixture.componentInstance.refreshRequested.subscribe(() => refreshes++);
    const host = fixture.nativeElement as HTMLElement;
    const refresh = host.querySelector('button') as HTMLButtonElement;

    expect(host.querySelector('.avatar')?.getAttribute('aria-label')).toBe('Yoshi Gomez');
    expect(refresh.textContent?.trim()).toBe('Refresh');
    refresh.click();
    expect(refreshes).toBe(1);
  });

  it('labels and disables the refresh control while a refresh is running', () => {
    const refresh = render(true).nativeElement.querySelector('button') as HTMLButtonElement;

    expect(refresh.disabled).toBeTrue();
    expect(refresh.textContent?.trim()).toBe('Updating…');
  });
});
