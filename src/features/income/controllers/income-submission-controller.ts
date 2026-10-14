import type { ReactiveControllerHost } from 'lit';
import { IncomeSchemaEngine } from '../engine/income-schema-engine.js';
import { saveIncomeApi } from '../api/income-api.js';
import type { Income, IncomeStepConfig } from '../types.js';

/** Maps and persists submitted form data without putting persistence logic in the dialog. */
export class IncomeSubmissionController {
  isSaving = false;
  errorMessage = '';

  constructor(private readonly host: ReactiveControllerHost) {}

  async save(
    values: Record<string, unknown>,
    existingIncome?: Income,
    config?: IncomeStepConfig,
  ): Promise<Income | undefined> {
    if (this.isSaving) return undefined;
    this.isSaving = true;
    this.errorMessage = '';
    this.host.requestUpdate();

    try {
      return await saveIncomeApi(IncomeSchemaEngine.mapFormToIncome(values, existingIncome, config));
    } catch {
      this.errorMessage = 'Nie udało się zapisać dochodu. Spróbuj ponownie.';
      return undefined;
    } finally {
      this.isSaving = false;
      this.host.requestUpdate();
    }
  }
}
