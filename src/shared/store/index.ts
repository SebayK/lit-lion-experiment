import { configureStore } from '@reduxjs/toolkit';
// Zmiana importu: ominięcie beczki (index.ts) plastra, aby uniknąć Circular Dependency.
import { incomeReducer } from '../../features/income/store/income-slice.js';

export const store = configureStore({
  reducer: {
    incomes: incomeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
