import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { rootReducer } from '../../../shared/store/index.js';

export interface CalculationState {
  loanAmount: number;
  periodMonths: number;
  monthlyInstallment: number;
}

const initialState: CalculationState = {
  loanAmount: 10000,
  periodMonths: 24,
  monthlyInstallment: 480,
};

export const calculationSlice = createSlice({
  name: 'calculation',
  initialState,
  reducers: {
    updateCalculation: (state, action: PayloadAction<Partial<CalculationState>>) => {
      Object.assign(state, action.payload);
    },
    resetCalculation: () => initialState,
  },
  selectors: {
    selectCalculation: (state) => state,
    selectLoanAmount: (state) => state.loanAmount,
    selectPeriodMonths: (state) => state.periodMonths,
    selectMonthlyInstallment: (state) => state.monthlyInstallment,
  },
});

// Inject slice into the rootReducer for dynamic modular registration
export const injectedCalculationSlice = calculationSlice.injectInto(rootReducer);

export const { updateCalculation, resetCalculation } = calculationSlice.actions;

export const {
  selectCalculation,
  selectLoanAmount,
  selectPeriodMonths,
  selectMonthlyInstallment,
} = injectedCalculationSlice.selectors;
