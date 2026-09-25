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
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
