// Public API for the Income feature slice

// 1. Export UI entry point (registers custom element)
export * from './components/income-app.js';

// 2. Export Redux store elements needed by the shell
export { incomeReducer, addIncome, updateIncome, deleteIncome } from './store/income-slice.js';

// 3. Export Public API & Types
export { saveIncomeApi } from './api/income-api.js';
export type { Income, IncomeStepConfig, IncomeSourceConfig, FieldValidationConfig, ValidationRule } from './types.js';

