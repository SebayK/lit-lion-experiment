import { expect } from '@esm-bundle/chai';
import { store } from './index.js';
import {
  setBusinessActivity,
  setDependentsCount,
  setMaritalStatus,
  selectClientProfile,
  selectHasBusiness,
  selectDependentsCount,
  resetClientProfile,
} from '../../features/client-profile/store/client-profile-slice.js';
import {
  updateCalculation,
  selectCalculation,
  selectLoanAmount,
  selectMonthlyInstallment,
  resetCalculation,
} from '../../features/calculation/store/calculation-slice.js';
import {
  addIncome,
  deleteIncome,
  updateIncome,
  selectIncomeItems,
  selectTotalIncome,
  selectAvailableIncomeSourceIds,
  resetIncomes,
} from '../../features/income/store/income-slice.js';
import type { Income } from '../../features/income/types.js';

describe('Modular Redux Store with combineSlices & injectInto', () => {
  beforeEach(() => {
    store.dispatch(resetClientProfile());
    store.dispatch(resetCalculation());
    store.dispatch(resetIncomes());
  });

  describe('1. Dynamic Slice Injection & Initial State', () => {
    it('initializes clientProfile slice with default state', () => {
      const state = store.getState();
      const profile = selectClientProfile(state);

      expect(profile).to.deep.equal({
        hasBusinessActivity: false,
        dependentsCount: 0,
        maritalStatus: 'single',
      });
      expect(selectHasBusiness(state)).to.be.false;
      expect(selectDependentsCount(state)).to.equal(0);
    });

    it('initializes calculation slice with default state', () => {
      const state = store.getState();
      const calc = selectCalculation(state);

      expect(calc).to.deep.equal({
        loanAmount: 10000,
        periodMonths: 24,
        monthlyInstallment: 480,
      });
      expect(selectLoanAmount(state)).to.equal(10000);
      expect(selectMonthlyInstallment(state)).to.equal(480);
    });

    it('initializes incomes slice with an empty items array', () => {
      const state = store.getState();
      const items = selectIncomeItems(state);

      expect(items).to.deep.equal([]);
      expect(selectTotalIncome(state)).to.equal(0);
    });
  });

  describe('2. Slice Operations & State Updates', () => {
    it('updates clientProfile state when actions are dispatched', () => {
      store.dispatch(setBusinessActivity(true));
      store.dispatch(setDependentsCount(3));
      store.dispatch(setMaritalStatus('married'));

      const state = store.getState();
      expect(selectHasBusiness(state)).to.be.true;
      expect(selectDependentsCount(state)).to.equal(3);
      expect(selectClientProfile(state).maritalStatus).to.equal('married');
    });

    it('updates calculation parameters', () => {
      store.dispatch(updateCalculation({ loanAmount: 25000, periodMonths: 36, monthlyInstallment: 820 }));

      const state = store.getState();
      expect(selectLoanAmount(state)).to.equal(25000);
      expect(selectMonthlyInstallment(state)).to.equal(820);
    });

    it('manages incomes (add, update, delete, total sum)', () => {
      const income1: Income = {
        id: 'inc-1',
        source: 'umowa_o_prace',
        amount: 6000,
        durationDetails: { type: 'nieokreslony' },
        paymentMethod: ['przelew'],
      };
      const income2: Income = {
        id: 'inc-2',
        source: '800+',
        amount: 800,
        durationDetails: { type: '' },
        paymentMethod: ['przelew'],
      };

      store.dispatch(addIncome(income1));
      store.dispatch(addIncome(income2));

      let state = store.getState();
      expect(selectIncomeItems(state)).to.have.lengthOf(2);
      expect(selectTotalIncome(state)).to.equal(6800);

      // Update
      store.dispatch(updateIncome({ ...income1, amount: 7000 }));
      state = store.getState();
      expect(selectTotalIncome(state)).to.equal(7800);

      // Delete
      store.dispatch(deleteIncome('inc-2'));
      state = store.getState();
      expect(selectIncomeItems(state)).to.have.lengthOf(1);
      expect(selectTotalIncome(state)).to.equal(7000);
    });
  });

  describe('3. Cross-Slice Communication (extraReducers & Selectors)', () => {
    it('automatically removes business incomes when business activity is turned off in clientProfile', () => {
      // 1. Client enables business activity
      store.dispatch(setBusinessActivity(true));

      // 2. Client adds both regular employment and B2B income
      const b2bIncome: Income = {
        id: 'inc-b2b',
        source: 'dzialalnosc_gospodarcza',
        amount: 12000,
        durationDetails: { type: 'nieokreslony' },
        paymentMethod: ['przelew'],
      };
      const regularIncome: Income = {
        id: 'inc-uop',
        source: 'umowa_o_prace',
        amount: 5000,
        durationDetails: { type: 'nieokreslony' },
        paymentMethod: ['przelew'],
      };

      store.dispatch(addIncome(b2bIncome));
      store.dispatch(addIncome(regularIncome));

      let state = store.getState();
      expect(selectIncomeItems(state)).to.have.lengthOf(2);
      expect(selectTotalIncome(state)).to.equal(17000);

      // 3. Client goes back and unchecks business activity
      store.dispatch(setBusinessActivity(false));

      // 4. incomesSlice.extraReducers cleans up B2B income while keeping employment income
      state = store.getState();
      const remaining = selectIncomeItems(state);
      expect(remaining).to.have.lengthOf(1);
      expect(remaining[0].id).to.equal('inc-uop');
      expect(remaining[0].source).to.equal('umowa_o_prace');
      expect(selectTotalIncome(state)).to.equal(5000);
    });

    it('cross-slice selector dynamically derives available income sources based on client profile state', () => {
      // Base state: no business, 0 dependents
      let sources = selectAvailableIncomeSourceIds(store.getState());
      expect(sources).to.deep.equal(['umowa_o_prace', 'umowa_zlecenie', 'emerytura']);

      // Enable business activity
      store.dispatch(setBusinessActivity(true));
      sources = selectAvailableIncomeSourceIds(store.getState());
      expect(sources).to.include('dzialalnosc_gospodarcza');
      expect(sources).to.not.include('800+');

      // Add dependents
      store.dispatch(setDependentsCount(2));
      sources = selectAvailableIncomeSourceIds(store.getState());
      expect(sources).to.include('dzialalnosc_gospodarcza');
      expect(sources).to.include('800+');

      // Disable business activity again
      store.dispatch(setBusinessActivity(false));
      sources = selectAvailableIncomeSourceIds(store.getState());
      expect(sources).to.not.include('dzialalnosc_gospodarcza');
      expect(sources).to.include('800+');
    });
  });
});
