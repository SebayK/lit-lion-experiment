import { createSlice, PayloadAction } from '@reduxjs/toolkit';
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
    }
  }
});

export const { addIncome, updateIncome, deleteIncome } = incomesSlice.actions;
export const incomeReducer = incomesSlice.reducer;
