import { expect, test } from '@playwright/test';
import {
  collectUnexpectedPageErrors,
  expectScenarioProgress,
  openSyntheticPreview,
  openWorkspace,
  workspaces
} from './helpers';

test.describe('synthetic preview', () => {
  test('is truthful, read-only, retryable, and navigable across all six workspaces', async ({ page }) => {
    const unexpectedErrors = collectUnexpectedPageErrors(page);
    const mutationRequests: string[] = [];
    page.on('request', request => {
      if (request.method() === 'POST') mutationRequests.push(request.url());
    });

    await openSyntheticPreview(page);
    await expect(page.getByText(/Synthetic preview — API unavailable/i).first()).toBeVisible();
    await expect(page.getByText(/This preview remains read-only/i)).toBeVisible();
    await expectScenarioProgress(page, 0);

    await expect(page.getByRole('button', { name: 'Start / reset' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Live API required' })).toBeDisabled();

    for (const workspace of workspaces) await openWorkspace(page, workspace);

    await expect(page.getByText('Read-only preview', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reset fictional scenario' })).toBeDisabled();

    await openWorkspace(page, workspaces.find(workspace => workspace.id === 'audit')!);
    await expect(page.getByText('Preview activity stream', { exact: true })).toBeVisible();
    await expect(page.getByText('PostgreSQL records', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Authoritative', { exact: true })).toHaveCount(0);

    const retry = page.getByRole('button', { name: 'Retry API' });
    await expect(retry).toBeEnabled();
    await retry.click();
    await expect(retry).toBeEnabled();
    await expect(page.locator('.observatory')).toHaveAttribute('data-api-mode', 'demo');
    await expect(page.getByText(/Synthetic preview — API unavailable/i).first()).toBeVisible();

    expect(mutationRequests).toEqual([]);
    expect(unexpectedErrors).toEqual([]);
  });

  test('claims filters and schedule modes remain usable without implying persistence', async ({ page }) => {
    await openSyntheticPreview(page);

    await openWorkspace(page, workspaces.find(workspace => workspace.id === 'schedule')!);
    const week = page.getByRole('button', { name: 'Week', exact: true });
    await week.click();
    await expect(week).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Seven-day capacity', { exact: true })).toBeVisible();

    const list = page.getByRole('button', { name: 'List', exact: true });
    await list.click();
    await expect(list).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByLabel('Appointment list results')).toBeVisible();
    const statusFilter = page.getByLabel('Filter by status');
    await statusFilter.selectOption({ index: 1 });
    await expect(statusFilter).not.toHaveValue('all');

    await openWorkspace(page, workspaces.find(workspace => workspace.id === 'claims')!);
    await page.getByLabel('Search claims').fill('CLM-742198');
    await expect(page.getByRole('row').filter({ hasText: 'CLM-742198' })).toBeVisible();
    await expect(page.getByText('1 results', { exact: true })).toBeVisible();

    await page.getByLabel('Search claims').fill('no-fictional-claim-matches-this');
    await expect(page.getByText('No claims match the current filters.', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters' }).first().click();
    await expect(page.getByLabel('Search claims')).toHaveValue('');
    await expect(page.getByText('12 results', { exact: true })).toBeVisible();
  });
});
