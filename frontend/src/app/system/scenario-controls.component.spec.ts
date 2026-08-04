import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PortfolioScenarioStep, createDemoDashboard } from '../../dashboard-model';
import { ScenarioControlsComponent } from './scenario-controls.component';

describe('ScenarioControlsComponent', () => {
  const dashboard = createDemoDashboard(new Date('2026-08-03T15:00:00.000Z'));

  beforeEach(() => TestBed.configureTestingModule({
    imports: [ScenarioControlsComponent],
    providers: [provideZonelessChangeDetection()]
  }));

  function render(options: {
    apiMode?: 'live' | 'demo';
    mutationPending?: boolean;
    complete?: boolean;
  } = {}) {
    const complete = options.complete ?? false;
    const scenario = complete ? {
      ...dashboard.scenario,
      completedSteps: dashboard.scenario.totalSteps,
      completionPercent: 100,
      currentStepId: 'inspect-proof',
      currentWorkspace: 'audit' as const,
      steps: dashboard.scenario.steps.map(step => ({ ...step, state: 'complete' as const }))
    } : dashboard.scenario;
    const currentStep: PortfolioScenarioStep = complete
      ? { id: 'inspect-proof', label: 'Inspect audit and publication proof', description: 'Review immutable proof.', workspace: 'audit', state: 'current' }
      : scenario.steps[0];
    const apiMode = options.apiMode ?? 'live';
    const mutationPending = options.mutationPending ?? false;
    const fixture = TestBed.createComponent(ScenarioControlsComponent);
    fixture.componentRef.setInput('scenario', scenario);
    fixture.componentRef.setInput('currentStep', currentStep);
    fixture.componentRef.setInput('apiMode', apiMode);
    fixture.componentRef.setInput('mutationPending', mutationPending);
    fixture.componentRef.setInput('canMutate', apiMode === 'live' && !mutationPending);
    fixture.componentRef.setInput('complete', complete);
    fixture.componentRef.setInput('actionLabel', mutationPending ? 'Saving…' : complete ? 'Inspect proof' : apiMode === 'live' ? 'Complete current step' : 'Live API required');
    fixture.detectChanges();
    return fixture;
  }

  it('disables persisted controls while a mutation is pending', () => {
    const host = render({ mutationPending: true }).nativeElement as HTMLElement;
    const buttons = Array.from(host.querySelectorAll('button'));

    expect((buttons.find(button => button.textContent?.includes('Start / reset')) as HTMLButtonElement).disabled).toBeTrue();
    expect((buttons.find(button => button.textContent?.includes('Saving')) as HTMLButtonElement).disabled).toBeTrue();
  });

  it('keeps synthetic preview persisted actions disabled and explains the live API requirement', () => {
    const host = render({ apiMode: 'demo' }).nativeElement as HTMLElement;

    expect((host.querySelector('.scenario-secondary') as HTMLButtonElement).disabled).toBeTrue();
    expect((host.querySelector('.scenario-primary') as HTMLButtonElement).disabled).toBeTrue();
    expect(host.querySelector('.scenario-actions')?.textContent).toContain('Persisted actions require the live API');
  });

  it('marks a completed scenario and keeps the proof action available', () => {
    const host = render({ complete: true }).nativeElement as HTMLElement;

    expect(host.closest('[data-state="complete"]') ?? host.querySelector('[data-state="complete"]')).not.toBeNull();
    expect(host.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('100');
    expect(host.querySelector('[role="progressbar"]')?.getAttribute('aria-label')).toBe('Scenario progress');
    expect((host.querySelector('.scenario-primary') as HTMLButtonElement).disabled).toBeFalse();
    expect(host.querySelector('.scenario-primary')?.textContent).toContain('Inspect proof');
  });

  it('emits explicit navigation and reset intents', () => {
    const fixture = render();
    const views: string[] = [];
    let resets = 0;
    fixture.componentInstance.stepSelected.subscribe(view => views.push(view));
    fixture.componentInstance.startRequested.subscribe(() => resets++);
    const buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));

    (buttons.find(button => button.textContent?.includes('Start / reset')) as HTMLButtonElement).click();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.scenario-steps button')?.click();

    expect(resets).toBe(1);
    expect(views).toEqual([dashboard.scenario.steps[0].workspace]);
  });

  it('preserves the audited minimum primary action target height', () => {
    render();
    const componentRules = Array.from(document.styleSheets).flatMap(styleSheet => {
      try {
        return Array.from(styleSheet.cssRules).filter(
          (rule): rule is CSSStyleRule => rule instanceof CSSStyleRule
        );
      } catch {
        return [];
      }
    });
    const primaryRules = componentRules.filter(rule =>
      rule.selectorText.includes('.scenario-primary') && rule.selectorText.includes('_ngcontent')
    );

    expect(primaryRules.map(rule => rule.style.minHeight))
      .withContext('the component-owned primary action rule must retain the 40px audit contract')
      .toContain('40px');
  });
});
