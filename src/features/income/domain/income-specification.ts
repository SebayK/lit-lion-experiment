import { Validator, Required, MinNumber, MaxNumber, MinLength, MaxLength } from '@lion/ui/form-core.js';
import { IncomeStepConfig } from '../types.js';

/**
 * Declarative validation rules for a single field. These are plain,
 * serializable data — the single source of truth for the Headless
 * Validation Engine — from which `@lion/ui` Validator instances are
 * instantiated on demand.
 */
export interface FieldRules {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
}

/**
 * Specification of one field for a given Income Source.
 *
 * `name` is a dotted path into the validated object (e.g.
 * `durationDetails.endDate`), so the Headless Validation Engine can resolve
 * values on nested domain models without any DOM involvement.
 */
export interface FieldSpecification {
  name: string;
  label: string;
  type: 'input' | 'amount';
  rules: FieldRules;
  /**
   * The field only participates in validation (and UI rendering) when this
   * predicate passes for the whole validated object. Omitted = always active.
   */
  isActive?: (value: Record<string, unknown>) => boolean;
}

/** Duration fields only apply when the user picked a fixed-term contract. */
const isActiveOkreslony = (value: Record<string, unknown>): boolean =>
  (value as { durationDetails?: { type?: string } })?.durationDetails?.type === 'okreslony';

/**
 * Base field set shared by most Income Sources. `800+`-like benefits have no
 * duration concept, so those fields are omitted for them.
 */
function baseFields(withDuration: boolean): FieldSpecification[] {
  const fields: FieldSpecification[] = [
    { name: 'source', label: 'Źródło dochodu', type: 'input', rules: { required: true } },
    { name: 'amount', label: 'Kwota', type: 'amount', rules: { required: true, min: 1 } },
    { name: 'currency', label: 'Waluta', type: 'input', rules: { required: true } }
  ];

  if (withDuration) {
    fields.push(
      { name: 'durationDetails.type', label: 'Czas trwania', type: 'input', rules: { required: true } },
      { name: 'durationDetails.endDate', label: 'Data końcowa', type: 'input', rules: { required: true }, isActive: isActiveOkreslony }
    );
  }

  fields.push({ name: 'paymentMethod', label: 'Metoda płatności', type: 'input', rules: { required: true } });
  return fields;
}

/**
 * Base specification per Income Source. Sources without an explicit entry
 * (e.g. product-specific ones) fall back to the full default field set.
 */
const BASE_800_PLUS = baseFields(false);
const BASE_SPECIFICATIONS: Record<string, FieldSpecification[]> = {
  umowa_o_prace: baseFields(true),
  zlecenie: baseFields(true),
  inne: baseFields(true),
  '800+': BASE_800_PLUS
};

/**
 * Income Specification — the single source of truth defining fields and
 * `@lion/ui` validator rules per Income Source.
 *
 * Combines base domain rules with product-specific rules provided via
 * `IncomeStepConfig` (config rules win over base rules field by field).
 */
export class IncomeSpecification {
  /**
   * All fields (base + product-specific) for a source, with rules merged
   * from the `IncomeStepConfig` when one is provided.
   */
  static getFieldsForSource(sourceId: string, config?: IncomeStepConfig): FieldSpecification[] {
    // Unknown product-specific sources default to the full base field set.
    const base = BASE_SPECIFICATIONS[sourceId] ?? baseFields(true);
    const sourceConfig = config?.availableSources.find(s => s.sourceId === sourceId);
    if (!sourceConfig) return base.map(field => ({ ...field, rules: { ...field.rules } }));

    const merged: FieldSpecification[] = base.map(field => ({
      ...field,
      rules: { ...field.rules, ...sourceConfig.validations?.[field.name] }
    }));

    const baseNames = new Set(base.map(f => f.name));
    (sourceConfig.fields ?? []).forEach(field => {
      if (baseNames.has(field.name)) return;
      merged.push({
        name: field.name,
        label: field.label,
        type: field.type === 'amount' ? 'amount' : 'input',
        rules: { required: field.required ?? false, ...sourceConfig.validations?.[field.name] }
      });
    });

    return merged;
  }

  /**
   * Declarative rules for a single field, or `undefined` when the field is
   * not part of the source's specification.
   */
  static getRulesForField(sourceId: string, fieldName: string, config?: IncomeStepConfig): FieldRules | undefined {
    return this.getFieldsForSource(sourceId, config).find(f => f.name === fieldName)?.rules;
  }

  /**
   * Fresh `@lion/ui` Validator instances for one field. Instances are created
   * on the fly so Redux state and cached objects never hold class references
   * (keeps store state serializable), and so param mutations (e.g.
   * `validator.param = x`) never leak between validation runs.
   */
  static createValidators(sourceId: string, fieldName: string, config?: IncomeStepConfig): Validator[] {
    const rules = this.getRulesForField(sourceId, fieldName, config);
    if (!rules) return [];

    const validators: Validator[] = [];
    if (rules.required) validators.push(new Required());
    if (rules.min !== undefined) validators.push(new MinNumber(rules.min));
    if (rules.max !== undefined) validators.push(new MaxNumber(rules.max));
    if (rules.minLength !== undefined) validators.push(new MinLength(rules.minLength));
    if (rules.maxLength !== undefined) validators.push(new MaxLength(rules.maxLength));
    return validators;
  }

}
