import { expect } from '@esm-bundle/chai';
import { IncomeSpecification } from './income-specification.js';
import { ValidationEngine } from './validation-engine.js';
import type { Income, IncomeStepConfig } from '../types.js';

const testConfig: IncomeStepConfig = {
  availableSources: [
    {
      sourceId: 'umowa_o_prace',
      label: 'Umowa o Pracę',
      fields: [
        { name: 'companyName', label: 'Nazwa pracodawcy', type: 'input', required: true },
        { name: 'nip', label: 'NIP pracodawcy', type: 'input', required: true }
      ],
      validations: {
        amount: { min: 2000, required: true },
        nip: { required: true, minLength: 10, maxLength: 10 },
        companyName: { required: true }
      }
    },
    {
      sourceId: '800+',
      label: 'Świadczenie 800+',
      fields: [
        { name: 'childrenCount', label: 'Liczba dzieci', type: 'amount', required: true }
      ],
      validations: {
        amount: { min: 800, max: 800, required: true },
        childrenCount: { min: 1, required: true }
      }
    }
  ]
};

function makeIncome(overrides: Partial<Income>): Income {
  return {
    id: 'income-1',
    source: 'umowa_o_prace',
    amount: 5000,
    currency: 'PLN',
    durationDetails: { type: 'nieokreslony' },
    paymentMethod: ['przelew'],
    companyName: 'Acme sp. z o.o.',
    nip: '1234567890',
    ...overrides
  };
}

describe('IncomeSpecification', () => {
  describe('createValidators (headless, no DOM)', () => {
    it('creates Required + MinNumber validators for amount of umowa_o_prace', () => {
      const validators = IncomeSpecification.createValidators('umowa_o_prace', 'amount', testConfig);
      const names = validators.map(v => (v.constructor as any).validatorName);

      expect(names).to.include('Required');
      expect(names).to.include('MinNumber');
    });

    it('uses the config-provided min param for amount', () => {
      const validators = IncomeSpecification.createValidators('umowa_o_prace', 'amount', testConfig);
      const minNumber = validators.find(v => (v.constructor as any).validatorName === 'MinNumber');

      expect(minNumber!.param).to.equal(2000);
    });

    it('creates MinLength/MaxLength validators for nip from config', () => {
      const validators = IncomeSpecification.createValidators('umowa_o_prace', 'nip', testConfig);
      const names = validators.map(v => (v.constructor as any).validatorName);

      expect(names).to.include.members(['Required', 'MinLength', 'MaxLength']);
    });

    it('creates validators for config-only fields (childrenCount)', () => {
      const validators = IncomeSpecification.createValidators('800+', 'childrenCount', testConfig);
      const names = validators.map(v => (v.constructor as any).validatorName);

      expect(names).to.include.members(['Required', 'MinNumber']);
    });

    it('falls back to base rules when no config is provided', () => {
      const validators = IncomeSpecification.createValidators('umowa_o_prace', 'amount');
      const minNumber = validators.find(v => (v.constructor as any).validatorName === 'MinNumber');

      expect(minNumber!.param).to.equal(1);
    });

    it('returns fresh instances on every call', () => {
      const a = IncomeSpecification.createValidators('umowa_o_prace', 'amount', testConfig);
      const b = IncomeSpecification.createValidators('umowa_o_prace', 'amount', testConfig);

      expect(a[0]).to.not.equal(b[0]);
    });
  });

  describe('getFieldsForSource', () => {
    it('returns base fields plus config fields for umowa_o_prace', () => {
      const fields = IncomeSpecification.getFieldsForSource('umowa_o_prace', testConfig);
      const names = fields.map(f => f.name);

      expect(names).to.include.members(['source', 'amount', 'currency', 'durationDetails.type', 'durationDetails.endDate', 'paymentMethod', 'companyName', 'nip']);
    });

    it('ignores duration fields for 800+', () => {
      const fields = IncomeSpecification.getFieldsForSource('800+', testConfig);
      const names = fields.map(f => f.name);

      expect(names).to.not.include('durationDetails.type');
      expect(names).to.not.include('durationDetails.endDate');
    });
  });
});

describe('ValidationEngine', () => {
  describe('umowa_o_prace base rules', () => {
    it('accepts a complete income', () => {
      const result = ValidationEngine.validate(makeIncome({}), 'umowa_o_prace', testConfig);

      expect(result.isValid).to.be.true;
      expect(result.errors).to.deep.equal({});
    });

    it('requires endDate only when duration type is okreslony', () => {
      const result = ValidationEngine.validate(makeIncome({ durationDetails: { type: 'okreslony' } }), 'umowa_o_prace', testConfig);

      expect(result.isValid).to.be.false;
      expect(result.errors['durationDetails.endDate']).to.deep.equal([
        { validatorName: 'Required', type: 'error' }
      ]);

      const okResult = ValidationEngine.validate(makeIncome({ durationDetails: { type: 'nieokreslony' } }), 'umowa_o_prace', testConfig);
      expect(okResult.isValid).to.be.true;
    });

    it('reports MinNumber with the config param when amount is too low', () => {
      const result = ValidationEngine.validate(makeIncome({ amount: 1000 }), 'umowa_o_prace', testConfig);

      expect(result.isValid).to.be.false;
      expect(result.errors.amount).to.deep.equal([
        { validatorName: 'MinNumber', param: 2000, type: 'error' }
      ]);
    });

    it('reports MinLength for a too-short nip', () => {
      const result = ValidationEngine.validate(makeIncome({ nip: '123' }), 'umowa_o_prace', testConfig);

      expect(result.isValid).to.be.false;
      expect(result.errors.nip?.map(e => e.validatorName)).to.include('MinLength');
    });

    it('reports Required for missing required config fields (companyName)', () => {
      const result = ValidationEngine.validate(makeIncome({ companyName: undefined }), 'umowa_o_prace', testConfig);

      expect(result.isValid).to.be.false;
      expect(result.errors.companyName).to.deep.equal([
        { validatorName: 'Required', type: 'error' }
      ]);
    });

    it('reports Required for an empty paymentMethod array', () => {
      const result = ValidationEngine.validate(makeIncome({ paymentMethod: [] }), 'umowa_o_prace', testConfig);

      expect(result.isValid).to.be.false;
      expect(result.errors.paymentMethod).to.deep.equal([
        { validatorName: 'Required', type: 'error' }
      ]);
    });
  });

  describe('800+ rules', () => {
    it('ignores duration fields entirely', () => {
      const result = ValidationEngine.validate(
        makeIncome({
          source: '800+',
          amount: 800,
          durationDetails: { type: '' },
          companyName: undefined,
          nip: undefined,
          childrenCount: 2
        }),
        '800+',
        testConfig
      );

      expect(result.isValid).to.be.true;
      expect(result.errors).to.deep.equal({});
    });

    it('enforces the fixed amount range (min 800, max 800)', () => {
      const tooLow = ValidationEngine.validate(makeIncome({ source: '800+', amount: 500, childrenCount: 1 }), '800+', testConfig);
      const tooHigh = ValidationEngine.validate(makeIncome({ source: '800+', amount: 1200, childrenCount: 1 }), '800+', testConfig);

      expect(tooLow.errors.amount?.map(e => e.validatorName)).to.include('MinNumber');
      expect(tooHigh.errors.amount?.map(e => e.validatorName)).to.include('MaxNumber');
    });

    it('enforces childrenCount min from config', () => {
      const result = ValidationEngine.validate(makeIncome({ source: '800+', amount: 800, childrenCount: 0 }), '800+', testConfig);

      expect(result.isValid).to.be.false;
      expect(result.errors.childrenCount).to.deep.equal([
        { validatorName: 'MinNumber', param: 1, type: 'error' }
      ]);
    });
  });

  describe('base rules without config', () => {
    it('still validates required fields and base amount minimum', () => {
      const result = ValidationEngine.validate(
        makeIncome({ amount: 0, companyName: undefined, nip: undefined }),
        'umowa_o_prace'
      );

      expect(result.isValid).to.be.false;
      expect(result.errors.amount?.map(e => e.validatorName)).to.include('MinNumber');
    });
  });
});
