import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { rootReducer, RootState } from '../../../shared/store/index.js';
import { setBusinessActivity } from '../../client-profile/store/client-profile-slice.js';
import { Income } from '../types.js';

export interface IncomesState {
  items: Income[];
}

const initialState: IncomesState = {
  items: [],
};

export const incomesSlice = createSlice({
  name: 'incomes',
  initialState,
  reducers: {
    addIncome: (state, action: PayloadAction<Income>) => {
      state.items.push(action.payload);
    },
    updateIncome: (state, action: PayloadAction<Income>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteIncome: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    resetIncomes: () => initialState,
  },
  extraReducers: (builder) => {
    // Cross-slice reaction: when business activity is disabled, clean up B2B / business incomes
    builder.addCase(setBusinessActivity, (state, action) => {
      if (!action.payload) {
        state.items = state.items.filter(
          item => item.source !== 'dzialalnosc_gospodarcza' && item.source !== 'business_b2b'
        );
      }
    });
  },
  selectors: {
    selectIncomeItems: (state) => state.items,
    selectTotalIncome: (state) => state.items.reduce((sum, item) => sum + (item.amount || 0), 0),
  },
});

// Inject slice into the rootReducer for dynamic modular registration
export const injectedIncomesSlice = incomesSlice.injectInto(rootReducer);

export const {
  addIncome,
  updateIncome,
  deleteIncome,
  resetIncomes,
} = incomesSlice.actions;

export const {
  selectIncomeItems,
  selectTotalIncome,
} = injectedIncomesSlice.selectors;

export const incomeReducer = incomesSlice.reducer;

/**
 * Cross-Slice Selector:
 * Derives available income source IDs by reading applicant profile state dynamically.
 */
export const selectAvailableIncomeSourceIds = createSelector(
  [
    (state: RootState) => (state as any).clientProfile?.hasBusinessActivity ?? false,
    (state: RootState) => (state as any).clientProfile?.dependentsCount ?? 0,
  ],
  (hasBusiness, dependentsCount) => {
    const sources = ['umowa_o_prace', 'umowa_zlecenie', 'emerytura'];

    if (hasBusiness) {
      sources.push('dzialalnosc_gospodarcza');
    }

    if (dependentsCount > 0) {
      sources.push('800+');
    }

    return sources;
  }
);
