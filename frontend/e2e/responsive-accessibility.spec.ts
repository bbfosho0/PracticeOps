import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { expectNoDocumentOverflow, openWorkspace, waitForRuntime, workspaceLabels } from './helpers';

for (const workspace of workspaceLabels) {
  test(`${workspace} workspace has no serious accessibility violations`, async ({ page }) => {
    await page.goto('/');
    await waitForRuntime(page);
    await openWorkspace(page, workspace);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const serious = results.violations.filter(item => item.impact === 'serious' || item.impact === 'critical');
    expect(serious).toEqual([]);
  });
}

test('configured viewport has no document-level horizontal overflow', async ({ page }) => {
  await page.goto('/');
  await waitForRuntime(page);

  for (const workspace of workspaceLabels) {
    await openWorkspace(page, workspace);
    await expectNoDocumentOverflow(page);
  }
});

test('primary navigation and scenario actions are keyboard reachable', async ({ page }) => {
  await page.goto('/');
  await waitForRuntime(page);

  await page.keyboard.press('Tab');
  for (let index = 0; index < 30; index += 1) {
    const focusedName = await page.evaluate(() => {
      const element = document.activeElement;
      return element?.getAttribute('aria-label') ?? element?.textContent?.trim() ?? '';
    });
    if (/Overview|Schedule|Documentation|Claims|Audit|System|Start \/ reset|Open current workspace/i.test(focusedName)) {
      await expect(page.locator(':focus')).toBeVisible();
      return;
    }
    await page.keyboard.press('Tab');
  }
  throw new Error('Primary navigation was not reachable within 30 Tab presses.');
});

test('reduced-motion project suppresses nonessential animation preference', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'reduced-motion', 'Reduced-motion assertion runs only in its dedicated project.');
  await page.goto('/');
  await waitForRuntime(page);

  const preference = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  expect(preference).toBeTrue();
  await expect(page.getByRole('progressbar', { name: 'Scenario progress' })).toBeVisible();
});
