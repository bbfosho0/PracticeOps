import { expect, Locator, Page } from '@playwright/test';

export interface WorkspaceExpectation {
  readonly id: 'overview' | 'schedule' | 'documentation' | 'claims' | 'audit' | 'settings';
  readonly navName: string;
  readonly heading: string;
}

export const workspaces: readonly WorkspaceExpectation[] = [
  { id: 'overview', navName: 'Overview', heading: 'Operations observatory' },
  { id: 'schedule', navName: 'Schedule', heading: 'Temporal runway' },
  { id: 'documentation', navName: 'Documentation', heading: 'Documentation continuum' },
  { id: 'claims', navName: 'Claims', heading: 'Risk constellation' },
  { id: 'audit', navName: 'Audit', heading: 'Event spectrum' },
  { id: 'settings', navName: 'System & Demo', heading: 'System & Demo' }
];

export async function openWorkspace(page: Page, workspace: WorkspaceExpectation): Promise<void> {
  const navigation = page.getByRole('button', { name: workspace.navName, exact: true });
  await navigation.click();
  await expect(navigation).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.observatory')).toHaveAttribute('data-view', workspace.id);
  await expect(page.getByRole('heading', { level: 1, name: workspace.heading, exact: true })).toBeVisible();
}

export async function openSyntheticPreview(page: Page): Promise<void> {
  await page.route('**/api/**', route => route.fulfill({
    status: 503,
    contentType: 'application/problem+json',
    body: JSON.stringify({ title: 'Synthetic preview test', status: 503 })
  }));
  await page.goto('/');
  await expect(page.locator('.observatory')).toHaveAttribute('data-api-mode', 'demo');
  await page.getByRole('button', { name: /Persisted employer journey Step 1 of 5/i }).click();
}

export async function expectNoDocumentOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

export async function expectVisibleSurfacesContained(page: Page): Promise<void> {
  const escaped = await page.locator([
    '.workspace .glass-panel',
    '.workspace .mode-notice',
    '.scenario-rail',
    '.portfolio-proof',
    '.workspace .filter-row'
  ].join(',')).evaluateAll(elements => elements.flatMap(element => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || rect.width === 0 || rect.height === 0)
      return [];
    const tolerance = 1;
    if (rect.left >= -tolerance && rect.right <= window.innerWidth + tolerance) return [];
    return [{
      surface: element.getAttribute('aria-label') ?? element.className,
      left: Math.round(rect.left),
      right: Math.round(rect.right),
      viewport: window.innerWidth
    }];
  }));
  expect(escaped, `Visible panels escaped the viewport: ${JSON.stringify(escaped)}`).toEqual([]);
}

export async function waitForRuntime(page: Page): Promise<'live' | 'demo'> {
  await expect(page.locator('.observatory')).toHaveAttribute('data-api-mode', /live|demo/);
  const mode = await page.locator('.observatory').getAttribute('data-api-mode');
  if (mode !== 'live' && mode !== 'demo') throw new Error(`Unexpected PracticeOps runtime mode: ${mode}`);
  return mode;
}

export async function expectScenarioProgress(page: Page, percent: number): Promise<void> {
  await expect(page.getByRole('progressbar', { name: 'Scenario progress' }))
    .toHaveAttribute('aria-valuenow', String(percent), { timeout: 20_000 });
}

export async function tabTo(page: Page, target: Locator, limit = 80): Promise<void> {
  for (let index = 0; index < limit; index += 1) {
    await page.keyboard.press('Tab');
    if (await target.evaluate(element => document.activeElement === element)) return;
  }
  throw new Error(`Target was not reachable within ${limit} Tab presses.`);
}

export async function expectVisibleFocus(target: Locator): Promise<void> {
  await expect(target).toBeFocused();
  await expect(target).toBeInViewport();
  const indicator = await target.evaluate(element => {
    const style = getComputedStyle(element);
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      boxShadow: style.boxShadow
    };
  });
  const outlined = indicator.outlineStyle !== 'none' && parseFloat(indicator.outlineWidth) > 0;
  const ringed = indicator.boxShadow !== 'none';
  expect(outlined || ringed, `Focused control has no visible indicator: ${JSON.stringify(indicator)}`).toBeTruthy();
}

export function collectUnexpectedPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (text === 'Failed to load resource: the server responded with a status of 503 (Service Unavailable)') return;
    errors.push(text);
  });
  return errors;
}
