import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import {
  expectNoDocumentOverflow,
  expectScenarioProgress,
  expectVisibleFocus,
  expectVisibleSurfacesContained,
  openSyntheticPreview,
  openWorkspace,
  tabTo,
  workspaces
} from './helpers';

test.setTimeout(90_000);

test('every workspace is accessible and contained at the configured viewport', async ({ page }) => {
  await openSyntheticPreview(page);

  for (const workspace of workspaces) {
    await openWorkspace(page, workspace);
    await expectNoDocumentOverflow(page);
    await expectVisibleSurfacesContained(page);
    await expect(page.getByRole('button', { name: workspace.navName, exact: true })).toBeVisible();

    const scenarioControls = page.locator('.scenario-rail');
    await scenarioControls.scrollIntoViewIfNeeded();
    await expect(scenarioControls).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open current workspace' })).toBeEnabled();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const serious = results.violations.filter(item => item.impact === 'serious' || item.impact === 'critical');
    expect(serious, `${workspace.navName} serious/critical axe violations`).toEqual([]);
  }
});

test('keyboard navigation exposes focus, aria-current, progress, and live status', async ({ page }) => {
  await openSyntheticPreview(page);

  const schedule = page.getByRole('button', { name: 'Schedule', exact: true });
  await tabTo(page, schedule);
  await expectVisibleFocus(schedule);
  await page.keyboard.press('Enter');
  await expect(schedule).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.observatory')).toHaveAttribute('data-view', 'schedule');

  const openCurrentWorkspace = page.getByRole('button', { name: 'Open current workspace' });
  await tabTo(page, openCurrentWorkspace);
  await expectVisibleFocus(openCurrentWorkspace);
  await page.keyboard.press('Enter');
  await expect(page.locator('.observatory')).toHaveAttribute('data-view', 'schedule');

  await expectScenarioProgress(page, 0);
  await expect(page.getByRole('progressbar', { name: 'Scenario progress' })).toHaveAttribute('aria-valuemax', '100');
  await expect(page.locator('.mode-notice[aria-live="polite"]')).toContainText('Synthetic preview');

  await openWorkspace(page, workspaces.find(workspace => workspace.id === 'overview')!);
  await expect(page.locator('p[role="status"][aria-live="polite"]')).toHaveCount(1);
});

test('reduced motion disables authored and ambient movement without blocking controls', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'reduced-motion', 'Dedicated reduced-motion project only.');
  await openSyntheticPreview(page);

  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBeTruthy();
  await openWorkspace(page, workspaces.find(workspace => workspace.id === 'claims')!);

  const authoredMotion = await page.locator('.header-copy > *').evaluateAll(elements => elements.map(element => {
    const html = element as HTMLElement;
    return { transform: html.style.transform, opacity: html.style.opacity };
  }));
  expect(authoredMotion).toEqual(authoredMotion.map(() => ({ transform: '', opacity: '' })));

  const ambientMotion = await page.locator('.aurora-primary').evaluate(element => {
    const style = getComputedStyle(element);
    return { duration: style.animationDuration, iterations: style.animationIterationCount };
  });
  expect(parseFloat(ambientMotion.duration)).toBeLessThanOrEqual(0.01);
  expect(ambientMotion.iterations).toBe('1');
  await expect(page.locator('.atmosphere-canvas')).toHaveAttribute('data-atmosphere-state', 'reduced');

  await openWorkspace(page, workspaces.find(workspace => workspace.id === 'schedule')!);
  await page.getByRole('button', { name: 'Week', exact: true }).click();
  await expect(page.getByText('Seven-day capacity', { exact: true })).toBeVisible();
  await expect(page.locator('.scenario-progress > span')).toHaveCSS('transition-duration', '0s');
});
