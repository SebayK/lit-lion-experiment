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

    it('denies access to client-profile when calculation is not completed', () => {
      expect(controller.canAccess('client-profile')).to.be.false;
    });

    it('denies access to income when client-profile is not completed', () => {
      expect(controller.canAccess('income')).to.be.false;
    });

    it('denies access to email-verification when income is not completed', () => {
      expect(controller.canAccess('email-verification')).to.be.false;
    });

    it('denies access to phone-verification when calculation, client-profile, income and email are not completed', () => {
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

    it('stores calculation data and unlocks client-profile step', () => {
      controller.completeCalculation(mockCalc);

      expect(controller.calculationData).to.deep.equal(mockCalc);
      expect(controller.canAccess('client-profile')).to.be.true;
      expect(controller.canAccess('income')).to.be.false;
      expect(host.updateCount).to.be.greaterThan(0);
    });
  });

  describe('Step Progression', () => {
    const mockCalc: CalculationData = {
      loanAmount: 15000,
      periodMonths: 24,
      monthlyInstallment: 685.50,
    };

    it('progresses from calculation to client-profile, income, email verification, and phone verification', () => {
      controller.completeCalculation(mockCalc);
      expect(controller.canAccess('client-profile')).to.be.true;
      expect(controller.canAccess('income')).to.be.false;

      controller.completeClientProfile();
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
      controller.completeClientProfile();
      controller.completeIncome();
      controller.completeEmailVerification('jan.kowalski@example.com');
      controller.completePhoneVerification('+48123456789');

      expect(controller.canAccess('dashboard')).to.be.true;
    });
  });

  describe('Reset', () => {
    it('keeps one application id for a process and creates a new one after reset', () => {
      const applicationId = controller.applicationId;

      controller.updateCalculation({ loanAmount: 10000 });
      expect(controller.applicationId).to.equal(applicationId);

      controller.reset();

      expect(controller.applicationId).to.not.equal(applicationId);
    });

    it('resets process state back to initial', () => {
      controller.completeCalculation({
        loanAmount: 10000,
        periodMonths: 12,
        monthlyInstallment: 900,
      });
      controller.completeClientProfile();
      controller.completeIncome();
      controller.completeEmailVerification('a@b.pl');
      controller.completePhoneVerification('123456789');

      controller.reset();

      expect(controller.calculationData).to.be.null;
      expect(controller.email).to.be.null;
      expect(controller.phone).to.be.null;
      expect(controller.canAccess('calculation')).to.be.true;
      expect(controller.canAccess('client-profile')).to.be.false;
      expect(controller.canAccess('income')).to.be.false;
    });
  });
});
