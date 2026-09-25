import { combineSlices, configureStore } from '@reduxjs/toolkit';

/**
 * Interface for type-safe lazy loaded slices via Redux Toolkit's withLazyLoadedSlices().
 * Individual slices augment or register their state dynamically with .injectInto(rootReducer).
 */
export interface LazyLoadedSlices {}

/**
 * Base rootReducer built with combineSlices for modular Vertical Slice Architecture.
 * Slices are injected independently by their respective feature modules.
 */
export const rootReducer = combineSlices().withLazyLoadedSlices<LazyLoadedSlices>();

export const store = configureStore({
  reducer: rootReducer,
  devTools: {
    name: 'Lit Lion Experiment',
    trace: true,
  },
});

// Expose store globally on window in development for direct debugging in console
if (typeof window !== 'undefined') {
  (window as any).store = store;
  (window as any).__REDUX_STORE__ = store;
}

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
