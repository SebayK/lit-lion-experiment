export interface ValidationRule {
  min?: number;
  max?: number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
}

export interface FieldValidationConfig {
  [fieldName: string]: ValidationRule;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: 'input' | 'amount' | 'select' | 'radio' | 'checkbox' | 'datepicker';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface IncomeSourceConfig {
  sourceId: string;
  label: string;
  fields?: FieldConfig[];
  validations?: FieldValidationConfig;
}

export interface IncomeStepConfig {
  availableSources: IncomeSourceConfig[];
}

export interface Income {
  id: string;
  name?: string;
  amount: number;
  source: string;
  durationDetails: {
    type: string;
    endDate?: string;
    durationInMonths?: number;
    durationInYears?: number;
  };
  paymentMethod: string[];
  currency?: string;
  companyName?: string;
  nip?: string;
  sector?: string;
  childrenCount?: number;
  childrenAges?: number[];
}
