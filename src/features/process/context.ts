import { createContext } from '@lit/context';
import type { ProcessController } from './controllers/process-controller.js';

/**
 * Lit Context token for the Application Process controller.
 *
 * ProcessShell provides it; Process Step pages consume it.
 */
export const processContext = createContext<ProcessController>('process-controller');
