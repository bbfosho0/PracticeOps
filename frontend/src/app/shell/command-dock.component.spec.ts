import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CommandDockComponent, WorkspaceNavItem } from './command-dock.component';

describe('CommandDockComponent', () => {
  const items: readonly WorkspaceNavItem[] = [
    { id: 'overview', label: 'Overview', shortLabel: 'Overview', icon: 'M0 0' },
    { id: 'claims', label: 'Claims', shortLabel: 'Claims', icon: 'M1 1' }
  ];

  beforeEach(() => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] }));

  function render(activeView: WorkspaceNavItem['id'] = 'overview', runtimeMode: 'connecting' | 'live' | 'demo' = 'live') {
    const fixture = TestBed.createComponent(CommandDockComponent);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('activeView', activeView);
    fixture.componentRef.setInput('runtimeMode', runtimeMode);
    fixture.detectChanges();
    return fixture;
  }

  it('emits the selected workspace from a dock item and the home control', () => {
    const fixture = render('overview');
    const selected: WorkspaceNavItem['id'][] = [];
    fixture.componentInstance.viewSelected.subscribe(view => selected.push(view));

    const host = fixture.nativeElement as HTMLElement;
    (host.querySelector('button[aria-label="Claims"]') as HTMLButtonElement).click();
    (host.querySelector('a[aria-label="PracticeOps home"]') as HTMLAnchorElement).click();

    expect(selected).toEqual(['claims', 'overview']);
  });

  it('exposes navigation names, current-page state, and the truthful runtime label', () => {
    const fixture = render('claims', 'demo');
    const host = fixture.nativeElement as HTMLElement;

    expect(host.getAttribute('aria-label')).toBe('PracticeOps navigation');
    expect(host.querySelector('button[aria-current="page"]')?.getAttribute('aria-label')).toBe('Claims');
    expect(host.querySelector('.dock-status')?.getAttribute('title')).toBe('Synthetic preview');
  });

  it('removes dock transitions and hover transforms under reduced motion', () => {
    render();
    const transitionRule = componentReducedMotionRule(selector => selector.includes('.dock-item[') && !selector.includes(':hover'));
    const hoverRule = componentReducedMotionRule(selector => selector.includes('.dock-item') && selector.includes(':hover'));

    expect(transitionRule?.transitionDuration).toBe('0.01ms');
    expect(hoverRule?.transform).toBe('none');
  });
});

function componentReducedMotionRule(matches: (selector: string) => boolean): CSSStyleDeclaration | undefined {
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
          && matches(nestedRule.selectorText)) {
          return nestedRule.style;
        }
      }
    }
  }
  return undefined;
}
