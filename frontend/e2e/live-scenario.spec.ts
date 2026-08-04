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

    const dashboardResponse = await page.request.get('/api/dashboard');
    expect(dashboardResponse.ok()).toBeTruthy();
    const persisted = await dashboardResponse.json() as LiveDashboard;
    expect(persisted.scenario).toMatchObject({ completedSteps: 5, totalSteps: 5 });
    expect(persisted.outbox.totalMessages).toBe(5);
    expect(persisted.outbox.publishedMessages + persisted.outbox.pendingMessages).toBe(5);

    await openWorkspace(page, workspaces.find(workspace => workspace.id === 'settings')!);
    await expect(systemValue(page, 'Scenario progress')).toHaveText('5/5 steps');
    await expect(systemValue(page, 'Outbox total')).toHaveText('5');
    await expect(systemValue(page, 'Published')).toHaveText(String(persisted.outbox.publishedMessages));
    await expect(systemValue(page, 'Pending')).toHaveText(String(persisted.outbox.pendingMessages));

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
});

async function completeCurrentStep(page: import('@playwright/test').Page, expectedProgress: number): Promise<void> {
  const response = page.waitForResponse(value => value.request().method() === 'POST' && /\/api\/(appointments|notes|claims)\/.+\/status$/.test(value.url()));
  await page.getByRole('button', { name: 'Complete current step' }).click();
  expect((await response).ok(), `Persisted transition for ${expectedProgress}% progress must succeed.`).toBeTruthy();
  await expectScenarioProgress(page, expectedProgress);
  await expect(page.getByRole('button', { name: expectedProgress === 100 ? 'Inspect proof' : 'Complete current step' })).toBeEnabled();
}

function systemValue(page: import('@playwright/test').Page, label: string) {
  return page.locator('.system-panel .system-fields > div')
    .filter({ has: page.getByText(label, { exact: true }) })
    .locator('strong');
}
