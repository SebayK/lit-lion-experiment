import { Validator } from '@lion/ui/form-core.js';
import { Income, IncomeStepConfig } from '../types.js';
import { IncomeSpecification } from './income-specification.js';

/** One failing validator, with everything needed to render or log feedback. */
export interface FieldErrorDetail {
  /** e.g. `'Required'`, `'MinNumber'` — same key Lion registers in `validationStates`. */
  validatorName: string;
  /** Constructor param of the validator, e.g. the minimum amount. */
  param?: unknown;
  type: 'error' | 'warning' | 'info' | 'success';
}

/**
 * DOM-independent validation outcome. `errors` is keyed by field name
 * (dotted paths preserved, e.g. `durationDetails.endDate`) and only contains
 * fields that currently fail.
 */
export interface HeadlessValidationResult {
  isValid: boolean;
  errors: Record<string, FieldErrorDetail[]>;
}

/**
 * Headless Validation Engine — runs Lion validators (`validator.execute()`)
 * programmatically against raw JS objects (`Income` or form values) without
 * requiring any DOM elements. Validator instances are created per run from
 * the Income Specification, keeping Redux state strictly serializable.
 */
export class ValidationEngine {
  /**
   * Validates a raw object (e.g. an `Income` from the Redux Store) against
   * the specification of its Income Source.
   */
  static validate(
    value: Income | Record<string, unknown>,
    sourceId: string,
    config?: IncomeStepConfig
  ): HeadlessValidationResult {
    const errors: Record<string, FieldErrorDetail[]> = {};

    if (!value || !sourceId) {
      return { isValid: false, errors: {} };
    }

    const target = value as unknown as Record<string, unknown>;

    for (const field of IncomeSpecification.getFieldsForSource(sourceId, config)) {
      if (field.isActive && !field.isActive(target)) continue;

      const raw = this.resolveValue(target, field.name);

      // `Required` has no `execute()` in Lion — its outcome depends on the
      // FormControl's emptiness check. The engine replicates that headlessly
      // and skips the remaining validators for empty values to avoid
      // duplicating the same failure (e.g. Required + MinNumber on "").
      if (this.isEmpty(raw)) {
        if (field.rules.required) {
          errors[field.name] = [{ validatorName: 'Required', type: 'error' }];
        }
        continue;
      }

      const fieldErrors: FieldErrorDetail[] = [];
      for (const validator of IncomeSpecification.createValidators(sourceId, field.name, config)) {
        if ((validator.constructor as typeof Validator).validatorName === 'Required') continue;
        if (validator.execute(raw, validator.param)) {
          fieldErrors.push({
            validatorName: (validator.constructor as typeof Validator).validatorName,
            param: validator.param,
            type: validator.type as FieldErrorDetail['type']
          });
        }
      }

      if (fieldErrors.length > 0) {
        errors[field.name] = fieldErrors;
      }
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  }

  /**
   * Convenience for the common "is this complete?" check on an `Income`:
   * validates the object against the specification of its own `source`.
   */
  static isIncomeValid(value: Income, config?: IncomeStepConfig): boolean {
    return this.validate(value, value.source, config).isValid;
  }

  /**
   * Headless equivalent of Lion's FormControl `__isEmpty`: `undefined`,
   * `null`, whitespace-only strings, empty arrays and `NaN` are empty.
   * `0` is a meaningful value — minimums are enforced by `MinNumber`.
   */
  static isEmpty(value: unknown): boolean {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'number') return Number.isNaN(value);
    return false;
  }

  /** Resolves a dotted path (`durationDetails.endDate`) on a plain object. */
  private static resolveValue(value: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce<unknown>(
      (acc, key) => (acc != null && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined),
      value
    );
  }
}
