import { Income, IncomeStepConfig } from '../types.js';
import { IncomeSpecification } from '../domain/income-specification.js';

export interface FieldDefinition {
  name: string;
  label: string;
  type: 'input' | 'amount';
  validators: any[];
}

/**
 * Form-mapping helper layer. Validator creation and schema queries are
 * delegated to the Income Specification (single source of truth) so UI
 * bindings and the headless Validation Engine share the same rules.
 */
export class IncomeSchemaEngine {
  static getValidatorsForField(config: IncomeStepConfig | undefined, sourceId: string, fieldName: string): any[] {
    return IncomeSpecification.createValidators(sourceId, fieldName, config);
  }

  static getFieldsForSource(config: IncomeStepConfig | undefined, sourceId: string): FieldDefinition[] {
    // Only product-specific (config-defined) fields — base fields such as
    // amount/currency/duration/paymentMethod are rendered by the dialog itself.
    const sourceConfig = config?.availableSources.find(s => s.sourceId === sourceId);

    return (sourceConfig?.fields ?? []).map(field => ({
      name: field.name,
      label: field.label,
      type: field.type === 'amount' || field.type === 'input' ? field.type : 'input',
      validators: IncomeSpecification.createValidators(sourceId, field.name, config)
    }));
  }

  static generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  static mapFormToIncome(rawFormValue: any, existingIncome?: Income, config?: IncomeStepConfig): Income {
    let endDateStr: string | undefined;
    if (rawFormValue.durationDetails?.endDate && rawFormValue.durationDetails.endDate !== '') {
      endDateStr = new Date(rawFormValue.durationDetails.endDate).toISOString();
    }

    // Get field names from config to know which optional fields to include
    const sourceId = rawFormValue.source;
    const sourceConfig = config?.availableSources.find(s => s.sourceId === sourceId);
    const configFieldNames = sourceConfig?.fields?.map(f => f.name) || [];

    // Build income object with only relevant fields
    const income: Income = {
      id: existingIncome?.id || this.generateId(),
      amount: rawFormValue.amount || 0,
      source: rawFormValue.source,
      currency: rawFormValue.currency,
      durationDetails: {
        type: rawFormValue.durationDetails?.type || '',
        endDate: endDateStr
      },
      paymentMethod: rawFormValue.paymentMethod || []
    };

    // Add dynamic fields from config
    if (configFieldNames.length > 0) {
      configFieldNames.forEach(fieldName => {
        if (rawFormValue[fieldName] !== undefined && rawFormValue[fieldName] !== '') {
          (income as any)[fieldName] = rawFormValue[fieldName];
        }
      });
    }

    return income;
  }

  static mapIncomeToFormValue(income: Income, config?: IncomeStepConfig): any {
    // Get field names from config to know which fields to include
    const sourceId = income.source;
    const sourceConfig = config?.availableSources.find(s => s.sourceId === sourceId);
    const configFieldNames = sourceConfig?.fields?.map(f => f.name) || [];

    const formValue: any = {
      source: income.source || '',
      amount: income.amount || 0,
      currency: income.currency || 'PLN',
      durationDetails: {
        type: income.durationDetails?.type || '',
        ...(income.durationDetails?.endDate
          ? { endDate: new Date(income.durationDetails.endDate) }
          : {})
      },
      paymentMethod: income.paymentMethod || []
    };

    // Add dynamic fields from config
    if (configFieldNames.length > 0) {
      configFieldNames.forEach(fieldName => {
        formValue[fieldName] = (income as any)[fieldName] || '';
      });
    }

    return formValue;
  }

  static getEmptyFormValue(source: string, config?: IncomeStepConfig): any {
    // Get field names from config
    const sourceConfig = config?.availableSources.find(s => s.sourceId === source);
    const configFields = sourceConfig?.fields || [];

    const emptyValue: any = {
      source: source,
      amount: 0,
      currency: 'PLN',
      durationDetails: { type: '' },
      paymentMethod: []
    };

    // Initialize empty fields from config
    configFields.forEach(field => {
      emptyValue[field.name] = field.type === 'amount' ? 0 : '';
    });

    return emptyValue;
  }
}
