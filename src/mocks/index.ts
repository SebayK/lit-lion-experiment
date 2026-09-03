import { registerMockRoutes } from '@web/mocks/browser.js';
import { handlers } from './income-handlers.js';

export function initMocks() {
  console.log('🛠️ [MSW] Initializing mock routes in browser...');
  registerMockRoutes(...handlers);
}
