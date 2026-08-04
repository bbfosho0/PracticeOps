import type { Meta, StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import type { Dashboard, MetricSignal } from '../../dashboard-model';
import { buildMetricSignals } from '../../dashboard-model';
import { createDashboardFixture } from '../testing/practiceops-fixtures';
import { MetricSignalStripComponent } from './metric-signal-strip.component';

function fixtureMetrics(): MetricSignal[] {
  return buildMetricSignals(structuredClone(createDashboardFixture()) as Dashboard);
}

const meta = {
  title: 'Clinical Observatory/Overview/Metric Signal Strip',
  component: MetricSignalStripComponent,
  tags: ['autodocs'],
  parameters: { layout: 'padded' }
} satisfies Meta<MetricSignalStripComponent>;

export default meta;
type Story = StoryObj<MetricSignalStripComponent>;

export const Normal: Story = { args: { metrics: fixtureMetrics() } };

export const Loading: Story = {
  args: {
    metrics: fixtureMetrics().map(metric => ({ ...metric, value: 0, detail: 'Awaiting operational snapshot' }))
  }
};

export const Refreshed: Story = {
  args: {
    metrics: fixtureMetrics().map((metric, index) => ({
      ...metric,
      value: metric.value + [2, -1, 1, 3][index],
      detail: `${metric.detail} · refreshed just now`
    }))
  }
};

export const CriticalRisk: Story = {
  args: {
    metrics: fixtureMetrics().map(metric => metric.label === 'Claims at risk'
      ? { ...metric, value: 18, detail: '$87.4k exposure · escalation required', tone: 'coral' }
      : metric)
  }
};

export const ReducedMotion: Story = {
  args: { metrics: fixtureMetrics() },
  parameters: {
    reducedMotion: true,
    docs: { description: { story: 'Static KPI values with prefers-reduced-motion: reduce enabled in the story environment.' } }
  },
  play: async () => {
    await expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
  }
};
