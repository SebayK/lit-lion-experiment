// Process step identifiers
export type ProcessStep =
  | 'calculation'
  | 'email-verification'
  | 'phone-verification'
  | 'dashboard';

// Data produced by the Calculation step and consumed by subsequent steps
export interface CalculationData {
  loanAmount: number;
  periodMonths: number;
  monthlyInstallment: number;
}

// Status of each step in the Application Process
export type StepStatus = 'pending' | 'completed';

export interface ProcessState {
  calculationData: CalculationData | null;
  stepStatuses: Record<ProcessStep, StepStatus>;
}
