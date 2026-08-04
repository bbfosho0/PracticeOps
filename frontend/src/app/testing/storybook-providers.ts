import { ApplicationConfig } from '@angular/core';

/**
 * Isolated stories intentionally provide no HTTP client or application stores.
 * Every state must arrive through component inputs backed by deterministic fixtures.
 */
export const STORYBOOK_APPLICATION_CONFIG: ApplicationConfig = {
  providers: []
};
