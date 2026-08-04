import type { Meta, StoryObj } from '@storybook/angular';
import { Component, signal } from '@angular/core';
import { expect, userEvent, within } from 'storybook/test';
import { createLiveRuntimeFixture, createSyntheticRuntimeFixture } from '../testing/practiceops-fixtures';
import { RuntimeNoticeComponent } from './runtime-notice.component';

const live = createLiveRuntimeFixture();
const synthetic = createSyntheticRuntimeFixture();

@Component({
  selector: 'story-runtime-retry-harness',
  standalone: true,
  imports: [RuntimeNoticeComponent],
  template: `
    <section appRuntimeNotice mode="demo" notice="API connection failed. Synthetic preview is read-only."
      [stale]="false" [retryAvailable]="true" (retryRequested)="recordRetry()"></section>
    <output aria-label="Retry requests">{{ retries() }}</output>
  `
})
class RuntimeRetryStoryHarnessComponent {
  readonly retries = signal(0);

  recordRetry(): void {
    this.retries.update(value => value + 1);
  }
}

const meta = {
  title: 'Clinical Observatory/Shell/Runtime Notice',
  component: RuntimeNoticeComponent,
  tags: ['autodocs'],
  parameters: { layout: 'padded' }
} satisfies Meta<RuntimeNoticeComponent>;

export default meta;
type Story = StoryObj<RuntimeNoticeComponent>;

export const Connecting: Story = {
  args: { mode: 'connecting', notice: 'Connecting to the PracticeOps API…', stale: false, retryAvailable: false }
};

export const Live: Story = {
  args: { mode: live.apiMode, notice: live.notice, stale: false, retryAvailable: true }
};

export const SyntheticPreview: Story = {
  args: { mode: synthetic.apiMode, notice: synthetic.notice, stale: false, retryAvailable: true }
};

export const StaleSnapshot: Story = {
  args: { mode: 'live', notice: 'Live refresh failed. Showing the last valid snapshot.', stale: true, retryAvailable: true }
};

export const ApiFailure: Story = {
  args: {
    mode: 'demo',
    notice: 'API connection failed. Synthetic preview is read-only.',
    stale: false,
    retryAvailable: true
  },
  render: () => ({
    template: '<story-runtime-retry-harness />',
    moduleMetadata: { imports: [RuntimeRetryStoryHarnessComponent] }
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Retry API' }));
    await expect(canvas.getByRole('status', { name: 'Retry requests' })).toHaveTextContent('1');
  }
};
