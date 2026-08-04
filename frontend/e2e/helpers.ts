import { expect, Page } from '@playwright/test';

export const workspaceLabels = ['Overview', 'Schedule', 'Documentation', 'Claims', 'Audit', 'System'] as const;

export async function openWorkspace(page: Page, label: typeof workspaceLabels[number]): Promise<void> {
  await page.getByRole('button', { name: label, exact: true }).click();
  await expect(page.locator('.observatory')).toHaveAttribute('data-view', label === 'System' ? 'settings' : label.toLowerCase());
}

export async function expectNoDocumentOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

export async function waitForRuntime(page: Page): Promise<'live' | 'demo'> {
  await expect(page.locator('.observatory')).toHaveAttribute('data-api-mode', /live|demo/);
  const mode = await page.locator('.observatory').getAttribute('data-api-mode');
  if (mode !== 'live' && mode !== 'demo') throw new Error(`Unexpected PracticeOps runtime mode: ${mode}`);
  return mode;
}

export function collectUnexpectedConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const text = message.text();
    if (/api\/dashboard|ERR_CONNECTION_REFUSED|Http failure response/i.test(text)) return;
    errors.push(text);
  });
  return errors;
}
