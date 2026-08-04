import { expect, test } from '@playwright/test';
import { expectScenarioProgress, openWorkspace, waitForRuntime, workspaces } from './helpers';

interface LiveDashboard {
  readonly scenario: { readonly completedSteps: number; readonly totalSteps: number };
  readonly outbox: {
    readonly totalMessages: number;
    readonly publishedMessages: number;
    readonly pendingMessages: number;
  };
}

const liveEnabled = process.env['PRACTICEOPS_E2E_LIVE'] === '1';

test.setTimeout(120_000);

test.describe('live persisted employer journey', () => {
  test.skip(!liveEnabled, 'Set PRACTICEOPS_E2E_LIVE=1 after starting postgres, rabbitmq, and api.');

  test('persists all five transitions, audit/outbox proof, refresh, and deterministic reset', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'The stateful live journey runs once in the desktop project.');

    const readiness = await page.request.get('/health/ready');
    expect(readiness.ok(), 'The Docker API readiness endpoint must be healthy.').toBeTruthy();
    const setup = await page.request.post('/api/demo/reset');
    expect(setup.ok(), 'Live setup must restore the deterministic fictional baseline.').toBeTruthy();

    await page.goto('/');
    expect(await waitForRuntime(page)).toBe('live');
    await expect(page.getByText('Live API', { exact: true }).first()).toBeVisible();

    const resetResponse = page.waitForResponse(response => response.request().method() === 'POST' && response.url().endsWith('/api/demo/reset'));
    await page.getByRole('button', { name: 'Start / reset' }).click();
    expect((await resetResponse).ok(), 'Visible Start / reset must call the live reset endpoint.').toBeTruthy();
    await expectScenarioProgress(page, 0);
    await expect(page.locator('.observatory')).toHaveAttribute('data-view', 'schedule');

    await completeCurrentStep(page, 20);
    await page.getByRole('button', { name: 'List', exact: true }).click();
    await expect(page.getByLabel('Appointment list results').locator('.scenario-record')).toContainText(/Luna Baker.*Confirmed/);

    await page.getByRole('button', { name: 'Open current workspace' }).click();
    await expect(page.locator('.observatory')).toHaveAttribute('data-view', 'documentation');
    await completeCurrentStep(page, 40);
    await expect(page.locator('.note-row.scenario-record')).toContainText('In Review');
    await completeCurrentStep(page, 60);
    await expect(page.locator('.note-row.scenario-record')).toHaveCount(0);

    await page.getByRole('button', { name: 'Open current workspace' }).click();
    await expect(page.locator('.observatory')).toHaveAttribute('data-view', 'claims');
    await completeCurrentStep(page, 80);
    await expect(page.locator('[role="row"].scenario-record')).toContainText('Ready For Submission');
    await completeCurrentStep(page, 100);
    await expect(page.locator('[role="row"].scenario-record')).toContainText('Submitted');
    await expect(page.getByRole('button', { name: 'Inspect proof' })).toBeEnabled();

    await page.getByRole('button', { name: 'Inspect proof' }).click();
    await expect(page.locator('.observatory')).toHaveAttribute('data-view', 'audit');
    const auditTable = page.getByRole('table', { name: 'Audit activity' });
    await expect(auditTable).toContainText('AppointmentStatusChanged');
    await expect(auditTable).toContainText('ClinicalNoteStatusChanged');
    await expect(auditTable).toContainText('ClaimStatusChanged');
    await expect(auditTable).toContainText('Persisted');

    await expect.poll(async () => {
      const response = await page.request.get('/api/dashboard');
      if (!response.ok()) return { completedSteps: -1, total: -1, published: -1, pending: -1 };
      const dashboard = await response.json() as LiveDashboard;
      return {
        completedSteps: dashboard.scenario.completedSteps,
        total: dashboard.outbox.totalMessages,
        published: dashboard.outbox.publishedMessages,
        pending: dashboard.outbox.pendingMessages
      };
    }, {
      message: 'The real outbox must reach its terminal broker-confirmed state.',
      timeout: 30_000,
      intervals: [250, 500, 1_000]
    }).toEqual({ completedSteps: 5, total: 5, published: 5, pending: 0 });

    const dashboardResponse = await page.request.get('/api/dashboard');
    expect(dashboardResponse.ok()).toBeTruthy();
    const persisted = await dashboardResponse.json() as LiveDashboard;
    expect(persisted.scenario).toMatchObject({ completedSteps: 5, totalSteps: 5 });
    expect(persisted.outbox).toMatchObject({ totalMessages: 5, publishedMessages: 5, pendingMessages: 0 });

    const refreshResponse = page.waitForResponse(response => response.request().method() === 'GET' && response.url().endsWith('/api/dashboard'));
    await page.getByRole('button', { name: 'Refresh', exact: true }).click();
    expect((await refreshResponse).ok(), 'Visible refresh must load the terminal outbox snapshot.').toBeTruthy();

    await openWorkspace(page, workspaces.find(workspace => workspace.id === 'settings')!);
    await expect(page.getByText('Authoritative status', { exact: true })).toBeVisible();
    await expect(page.getByText('Derived from live records', { exact: true })).toBeVisible();
    await expect(systemValue(page, 'scenario-progress')).toHaveText('5/5 steps');
    await expect(systemValue(page, 'outbox-total')).toHaveText('5');
    await expect(systemValue(page, 'outbox-published')).toHaveText(String(persisted.outbox.publishedMessages));
    await expect(systemValue(page, 'outbox-pending')).toHaveText(String(persisted.outbox.pendingMessages));

    await page.reload();
    expect(await waitForRuntime(page)).toBe('live');
    await expectScenarioProgress(page, 100);
    await expect(page.getByRole('button', { name: 'Inspect proof' })).toBeEnabled();

    await openWorkspace(page, workspaces.find(workspace => workspace.id === 'settings')!);
    const finalResetResponse = page.waitForResponse(response => response.request().method() === 'POST' && response.url().endsWith('/api/demo/reset'));
    await page.getByRole('button', { name: 'Reset fictional scenario' }).click();
    expect((await finalResetResponse).ok(), 'Visible system reset must restore the baseline.').toBeTruthy();
    await expectScenarioProgress(page, 0);
    await expect(page.locator('.observatory')).toHaveAttribute('data-view', 'schedule');
    await page.getByRole('button', { name: 'List', exact: true }).click();
    await expect(page.getByLabel('Appointment list results').locator('.scenario-record')).toContainText(/Luna Baker.*Scheduled/);

    const baselineResponse = await page.request.get('/api/dashboard');
    const baseline = await baselineResponse.json() as LiveDashboard;
    expect(baseline.scenario.completedSteps).toBe(0);
    expect(baseline.outbox).toMatchObject({ totalMessages: 0, publishedMessages: 0, pendingMessages: 0 });
  });

  test('persists one scenario action when reduced motion is enabled', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'reduced-motion', 'The persisted reduced-motion check runs in its dedicated project.');

    const readiness = await page.request.get('/health/ready');
    expect(readiness.ok()).toBeTruthy();
    const setup = await page.request.post('/api/demo/reset');
    expect(setup.ok()).toBeTruthy();

    await page.goto('/');
    expect(await waitForRuntime(page)).toBe('live');
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBeTruthy();

    const resetResponse = page.waitForResponse(response => response.request().method() === 'POST' && response.url().endsWith('/api/demo/reset'));
    await page.getByRole('button', { name: 'Start / reset' }).click();
    expect((await resetResponse).ok()).toBeTruthy();
    await expectScenarioProgress(page, 0);

    await completeCurrentStep(page, 20);
    const persistedResponse = await page.request.get('/api/dashboard');
    expect(persistedResponse.ok()).toBeTruthy();
    const persisted = await persistedResponse.json() as LiveDashboard;
    expect(persisted.scenario.completedSteps).toBe(1);

    const restoreResponse = page.waitForResponse(response => response.request().method() === 'POST' && response.url().endsWith('/api/demo/reset'));
    await page.getByRole('button', { name: 'Start / reset' }).click();
    expect((await restoreResponse).ok()).toBeTruthy();
    await expectScenarioProgress(page, 0);
  });
});

async function completeCurrentStep(page: import('@playwright/test').Page, expectedProgress: number): Promise<void> {
  const response = page.waitForResponse(value => value.request().method() === 'POST' && /\/api\/(appointments|notes|claims)\/.+\/status$/.test(value.url()));
  await page.getByRole('button', { name: 'Complete current step' }).click();
  expect((await response).ok(), `Persisted transition for ${expectedProgress}% progress must succeed.`).toBeTruthy();
  await expectScenarioProgress(page, expectedProgress);
  await expect(page.getByRole('button', { name: expectedProgress === 100 ? 'Inspect proof' : 'Complete current step' })).toBeEnabled();
}

function systemValue(page: import('@playwright/test').Page, field: 'scenario-progress' | 'outbox-total' | 'outbox-published' | 'outbox-pending') {
  return page.getByTestId(`system-${field}`);
}
