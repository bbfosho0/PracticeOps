import { applicationConfig, componentWrapperDecorator, type Preview } from '@storybook/angular';
import { STORYBOOK_APPLICATION_CONFIG } from '../src/app/testing/storybook-providers';

const browserMatchMedia = window.matchMedia.bind(window);

const preview: Preview = {
  decorators: [
    applicationConfig(STORYBOOK_APPLICATION_CONFIG),
    componentWrapperDecorator(story => `<main style="min-height:100vh;padding:24px;background:#05070e;color:#f5f7ff;font-family:Inter,ui-sans-serif,system-ui,sans-serif">${story}</main>`)
  ],
  loaders: [async ({ parameters }) => {
    const reduceMotion = parameters['reducedMotion'] === true;
    window.matchMedia = query => {
      const result = browserMatchMedia(query);
      if (!reduceMotion || query !== '(prefers-reduced-motion: reduce)') return result;
      return new Proxy(result, {
        get(target, property) {
          if (property === 'matches') return true;
          const value: unknown = Reflect.get(target, property, target);
          return typeof value === 'function' ? value.bind(target) : value;
        }
      });
    };
    return {};
  }],
  parameters: {
    layout: 'fullscreen',
    a11y: { test: 'error' },
    backgrounds: {
      default: 'observatory',
      values: [{ name: 'observatory', value: '#05070e' }]
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  }
};

export default preview;
