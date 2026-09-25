import { expect } from '@esm-bundle/chai';
import { ProcessController } from './process-controller.js';
import type { CalculationData } from '../types.js';
import type { ReactiveControllerHost } from 'lit';

class MockHost implements ReactiveControllerHost {
  updateCount = 0;
  addController() {}
  removeController() {}
  requestUpdate() {
    this.updateCount++;
  }
  updateComplete = Promise.resolve(true);
}

describe('ProcessController', () => {
  let host: MockHost;
  let controller: ProcessController;

  beforeEach(() => {
    host = new MockHost();
    controller = new ProcessController(host);
  });

  describe('Initial State and Access Guards', () => {
    it('allows access to calculation step initially', () => {
      expect(controller.canAccess('calculation')).to.be.true;
    });

    it('denies access to income when calculation is not completed', () => {
      expect(controller.canAccess('income')).to.be.false;
    });

    it('denies access to email-verification when income is not completed', () => {
      expect(controller.canAccess('email-verification')).to.be.false;
    });

    it('denies access to phone-verification when calculation, income and email are not completed', () => {
      expect(controller.canAccess('phone-verification')).to.be.false;
    });

    it('denies access to dashboard when prior steps are not completed', () => {
      expect(controller.canAccess('dashboard')).to.be.false;
    });
  });

  describe('Calculation Step Completion', () => {
    const mockCalc: CalculationData = {
      loanAmount: 15000,
      periodMonths: 24,
      monthlyInstallment: 685.50,
    };

    it('stores calculation data and unlocks income step', () => {
      controller.completeCalculation(mockCalc);

      expect(controller.calculationData).to.deep.equal(mockCalc);
      expect(controller.canAccess('income')).to.be.true;
      expect(controller.canAccess('email-verification')).to.be.false;
      expect(host.updateCount).to.be.greaterThan(0);
    });
  });

  describe('Contact Verification Step Progression', () => {
    const mockCalc: CalculationData = {
      loanAmount: 15000,
      periodMonths: 24,
      monthlyInstallment: 685.50,
    };

    it('progresses from calculation to income, email verification, and phone verification', () => {
      controller.completeCalculation(mockCalc);
      expect(controller.canAccess('income')).to.be.true;
      expect(controller.canAccess('email-verification')).to.be.false;

      controller.completeIncome();
      expect(controller.canAccess('email-verification')).to.be.true;
      expect(controller.canAccess('phone-verification')).to.be.false;

      controller.completeEmailVerification('jan.kowalski@example.com');
      expect(controller.canAccess('phone-verification')).to.be.true;
      expect(controller.canAccess('dashboard')).to.be.false;
    });

    it('unlocks dashboard only after phone is also verified', () => {
      controller.completeCalculation(mockCalc);
      controller.completeIncome();
      controller.completeEmailVerification('jan.kowalski@example.com');
      controller.completePhoneVerification('+48123456789');

      expect(controller.canAccess('dashboard')).to.be.true;
    });
  });

  describe('Reset', () => {
    it('resets process state back to initial', () => {
      controller.completeCalculation({
        loanAmount: 10000,
        periodMonths: 12,
        monthlyInstallment: 900,
      });
      controller.reset();

      expect(controller.calculationData).to.be.null;
      expect(controller.canAccess('income')).to.be.false;
      expect(controller.canAccess('email-verification')).to.be.false;
    });
  });

  describe('getFirstUncompletedStep', () => {
    const mockCalc: CalculationData = {
      loanAmount: 15000,
      periodMonths: 24,
      monthlyInstallment: 685.50,
    };

    it('returns calculation when all steps are pending', () => {
      expect(controller.getFirstUncompletedStep()).to.equal('calculation');
    });

    it('returns income when calculation is completed', () => {
      controller.completeCalculation(mockCalc);
      expect(controller.getFirstUncompletedStep()).to.equal('income');
    });

    it('returns email-verification when calculation and income are completed', () => {
      controller.completeCalculation(mockCalc);
      controller.completeIncome();
      expect(controller.getFirstUncompletedStep()).to.equal('email-verification');
    });

    it('returns phone-verification when calculation, income, and email are completed', () => {
      controller.completeCalculation(mockCalc);
      controller.completeIncome();
      controller.completeEmailVerification('jan.kowalski@example.com');
      expect(controller.getFirstUncompletedStep()).to.equal('phone-verification');
    });

    it('returns dashboard when calculation, income, email, and phone are completed', () => {
      controller.completeCalculation(mockCalc);
      controller.completeIncome();
      controller.completeEmailVerification('jan.kowalski@example.com');
      controller.completePhoneVerification('+48123456789');
      expect(controller.getFirstUncompletedStep()).to.equal('dashboard');
    });

    it('returns calculation as fallback when all steps are completed', () => {
      controller.completeCalculation(mockCalc);
      controller.completeIncome();
      controller.completeEmailVerification('jan.kowalski@example.com');
      controller.completePhoneVerification('+48123456789');
      controller.stepStatuses.dashboard = 'completed';
      expect(controller.getFirstUncompletedStep()).to.equal('calculation');
    });

    it('returns calculation after reset', () => {
      controller.completeCalculation(mockCalc);
      controller.completeIncome();
      controller.completeEmailVerification('jan.kowalski@example.com');
      controller.reset();
      expect(controller.getFirstUncompletedStep()).to.equal('calculation');
    });
  });

  describe('Subscribers & Live Updates', () => {
    it('notifies registered subscriber hosts when updateCalculation is called', () => {
      const subscriber1 = new MockHost();
      const subscriber2 = new MockHost();

      const unsubscribe1 = controller.subscribe(subscriber1);
      const unsubscribe2 = controller.subscribe(subscriber2);

      controller.updateCalculation({
        loanAmount: 20000,
        periodMonths: 36,
        monthlyInstallment: 600,
      });

      expect(controller.calculationData?.loanAmount).to.equal(20000);
      expect(host.updateCount).to.be.greaterThan(0);
      expect(subscriber1.updateCount).to.equal(1);
      expect(subscriber2.updateCount).to.equal(1);

      // Unsubscribe subscriber1
      unsubscribe1();

      controller.updateCalculation({
        loanAmount: 25000,
      });

      expect(controller.calculationData?.loanAmount).to.equal(25000);
      expect(subscriber1.updateCount).to.equal(1); // not called again
      expect(subscriber2.updateCount).to.equal(2); // called again

      unsubscribe2();
    });

    it('notifies subscribers on completeStep and reset', () => {
      const subscriber = new MockHost();
      controller.subscribe(subscriber);

      controller.completeCalculation({
        loanAmount: 10000,
        periodMonths: 12,
        monthlyInstallment: 900,
      });
      expect(subscriber.updateCount).to.equal(1);

      controller.completeEmailVerification('test@example.com');
      expect(subscriber.updateCount).to.equal(2);

      controller.reset();
      expect(subscriber.updateCount).to.equal(3);
    });
  });
});
