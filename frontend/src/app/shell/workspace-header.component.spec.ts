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

  it('renders workspace metadata and a single merged status pill', () => {
    const host = render().nativeElement as HTMLElement;

    expect(host.querySelector('h1')?.textContent).toContain('Risk constellation');
    expect(host.querySelector('.status-pill')?.textContent).toContain('Live API');
    expect(host.querySelector('.status-pill')?.getAttribute('data-tone')).toBe('green');
    expect(host.querySelector('.live-pill')).toBeNull();
  });

  it('provides accessible names and emits refresh requests when available', () => {
    const fixture = render();
    let refreshes = 0;
    fixture.componentInstance.refreshRequested.subscribe(() => refreshes++);
    const host = fixture.nativeElement as HTMLElement;
    const refresh = host.querySelector('.refresh-control') as HTMLButtonElement;

    expect(host.querySelector('.avatar')?.getAttribute('aria-label')).toBe('Yoshi Gomez');
    expect(refresh.getAttribute('aria-label')).toBe('Refresh');
    refresh.click();
    expect(refreshes).toBe(1);
  });

  it('labels and disables the refresh control while a refresh is running', () => {
    const refresh = render(true).nativeElement.querySelector('.refresh-control') as HTMLButtonElement;

    expect(refresh.disabled).toBeTrue();
    expect(refresh.getAttribute('aria-busy')).toBe('true');
  });

  it('stops the live status animation under reduced motion', () => {
    render();
    const reducedMotionRule = componentReducedMotionRule('.status-dot[');

    expect(reducedMotionRule?.animationName).toBe('none');
  });
});

function componentReducedMotionRule(selectorFragment: string): CSSStyleDeclaration | undefined {
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSMediaRule) || !rule.conditionText.includes('prefers-reduced-motion')) continue;
      for (const nestedRule of Array.from(rule.cssRules)) {
        if (nestedRule instanceof CSSStyleRule
          && nestedRule.selectorText.includes('_ngcontent')
          && nestedRule.selectorText.includes(selectorFragment)) {
          return nestedRule.style;
        }
      }
    }
  }
  return undefined;
}
