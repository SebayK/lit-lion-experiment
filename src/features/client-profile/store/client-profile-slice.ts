import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { rootReducer } from '../../../shared/store/index.js';

export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed';

export interface ClientProfileState {
  hasBusinessActivity: boolean;
  dependentsCount: number;
  maritalStatus: MaritalStatus;
}

const initialState: ClientProfileState = {
  hasBusinessActivity: false,
  dependentsCount: 0,
  maritalStatus: 'single',
};

export const clientProfileSlice = createSlice({
  name: 'clientProfile',
  initialState,
  reducers: {
    setBusinessActivity: (state, action: PayloadAction<boolean>) => {
      state.hasBusinessActivity = action.payload;
    },
    setDependentsCount: (state, action: PayloadAction<number>) => {
      state.dependentsCount = action.payload;
    },
    setMaritalStatus: (state, action: PayloadAction<MaritalStatus>) => {
      state.maritalStatus = action.payload;
    },
    resetClientProfile: () => initialState,
  },
  selectors: {
    selectClientProfile: (state) => state,
    selectHasBusiness: (state) => state.hasBusinessActivity,
    selectDependentsCount: (state) => state.dependentsCount,
    selectMaritalStatus: (state) => state.maritalStatus,
  },
});

// Inject slice into the rootReducer for dynamic modular registration
export const injectedClientProfileSlice = clientProfileSlice.injectInto(rootReducer);

export const {
  setBusinessActivity,
  setDependentsCount,
  setMaritalStatus,
  resetClientProfile,
} = clientProfileSlice.actions;

export const {
  selectClientProfile,
  selectHasBusiness,
  selectDependentsCount,
  selectMaritalStatus,
} = injectedClientProfileSlice.selectors;
