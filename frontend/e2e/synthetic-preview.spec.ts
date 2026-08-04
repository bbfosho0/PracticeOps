import { expect, test } from '@playwright/test';
import { collectUnexpectedConsoleErrors, openWorkspace, waitForRuntime, workspaceLabels } from './helpers';

test.describe('synthetic preview', () => {
  test('remains truthful, read-only, and navigable when the API is unavailable', async ({ page }) => {
    const consoleErrors = collectUnexpectedConsoleErrors(page);
    await page.goto('/');

    expect(await waitForRuntime(page)).toBe('demo');
    await expect(page.getByText(/Synthetic preview/i).first()).toBeVisible();
    await expect(page.getByText(/Persisted actions require the live API/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start / reset' })).toBeDisabled();
    await expect(page.getByRole('button', { name: /Live API required/i })).toBeDisabled();

    for (const workspace of workspaceLabels) {
      await openWorkspace(page, workspace);
    }

    expect(consoleErrors).toEqual([]);
  });

  test('offers a retry without falsely changing the runtime state', async ({ page }) => {
    await page.goto('/');
    expect(await waitForRuntime(page)).toBe('demo');

    const retry = page.getByRole('button', { name: /retry/i });
    await expect(retry).toBeEnabled();
    await retry.click();

    await expect(page.locator('.observatory')).toHaveAttribute('data-api-mode', 'demo');
    await expect(page.getByText(/Synthetic preview/i).first()).toBeVisible();
  });
});
