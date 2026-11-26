import { expect } from '@esm-bundle/chai';
import { LitElement, html } from 'lit';
import { LionForm } from '@lion/ui/form.js';
import { LionFieldset } from '@lion/ui/fieldset.js';
import { LionRadioGroup, LionRadio } from '@lion/ui/radio-group.js';
import { LionCheckboxGroup, LionCheckbox } from '@lion/ui/checkbox-group.js';
import { LionInput } from '@lion/ui/input.js';
import { Required, Validator } from '@lion/ui/form-core.js';
import { FormController, ValidationResult } from './FormController.js';

// Register lion elements globally (no ScopedElementsMixin needed in tests)
if (!customElements.get('lion-form')) customElements.define('lion-form', LionForm);
if (!customElements.get('lion-fieldset')) customElements.define('lion-fieldset', LionFieldset);
if (!customElements.get('lion-radio-group')) customElements.define('lion-radio-group', LionRadioGroup);
if (!customElements.get('lion-radio')) customElements.define('lion-radio', LionRadio);
if (!customElements.get('lion-checkbox-group')) customElements.define('lion-checkbox-group', LionCheckboxGroup);
if (!customElements.get('lion-checkbox')) customElements.define('lion-checkbox', LionCheckbox);
if (!customElements.get('lion-input')) customElements.define('lion-input', LionInput);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function nextFrame(): Promise<void> {
  await new Promise(resolve => requestAnimationFrame(resolve));
  await new Promise(resolve => setTimeout(resolve, 0));
}

async function aLittleMore(): Promise<void> {
  await nextFrame();
  await nextFrame();
  await nextFrame();
}

// ---------------------------------------------------------------------------
// Fixtures — inline, no ScopedElementsMixin
// ---------------------------------------------------------------------------

class TestFormRadioInFieldset extends LitElement {
  lastResult: ValidationResult | null = null;
  readonly ctrl = new FormController(this, {
    onValidate: (r) => { this.lastResult = r; },
  });

  render() {
    return html`
      <lion-form>
        <form>
          <lion-input name="name" label="Name" .validators=${[new Required()]}></lion-input>
          <lion-fieldset name="group">
            <lion-radio-group
              name="choice"
              label="Choice"
              .validators=${[new Required()]}
            >
              <lion-radio label="A" .choiceValue=${'a'}></lion-radio>
              <lion-radio label="B" .choiceValue=${'b'}></lion-radio>
            </lion-radio-group>
          </lion-fieldset>
        </form>
      </lion-form>
    `;
  }
}
if (!customElements.get('test-form-radio-fieldset')) customElements.define('test-form-radio-fieldset', TestFormRadioInFieldset);

class TestFormCheckboxDirect extends LitElement {
  lastResult: ValidationResult | null = null;
  readonly ctrl = new FormController(this, {
    onValidate: (r) => { this.lastResult = r; },
  });

  render() {
    return html`
      <lion-form>
        <form>
          <lion-checkbox-group
            name="options"
            label="Options"
            .validators=${[new Required()]}
          >
            <lion-checkbox label="X" .choiceValue=${'x'}></lion-checkbox>
            <lion-checkbox label="Y" .choiceValue=${'y'}></lion-checkbox>
          </lion-checkbox-group>
        </form>
      </lion-form>
    `;
  }
}
if (!customElements.get('test-form-checkbox')) customElements.define('test-form-checkbox', TestFormCheckboxDirect);

class CrossFieldMismatch extends Validator {
  static get validatorName() {
    return 'CrossFieldMismatch';
  }
  execute(modelValue: Record<string, unknown>) {
    return modelValue.a !== modelValue.b;
  }
}

class DateRangeInvalid extends Validator {
  static get validatorName() {
    return 'DateRangeInvalid';
  }
  execute(modelValue: Record<string, unknown>) {
    return modelValue.from === modelValue.to;
  }
}

class MinTwoSelected extends Validator {
  static get validatorName() {
    return 'MinTwoSelected';
  }
  execute(modelValue: unknown) {
    return !Array.isArray(modelValue) || modelValue.length < 2;
  }
}

class AlwaysFailCheckbox extends Validator {
  static get validatorName() {
    return 'AlwaysFailCheckbox';
  }
  execute() {
    return true;
  }
}

class TestFormOwnValidator extends LitElement {
  readonly ctrl = new FormController(this);

  render() {
    return html`
      <lion-form .validators=${[new CrossFieldMismatch()]}>
        <form>
          <lion-input name="a" label="A" .modelValue=${'foo'}></lion-input>
          <lion-input name="b" label="B" .modelValue=${'bar'}></lion-input>
        </form>
      </lion-form>
    `;
  }
}
if (!customElements.get('test-form-own-validator')) {
  customElements.define('test-form-own-validator', TestFormOwnValidator);
}

class TestFieldsetOwnValidator extends LitElement {
  readonly ctrl = new FormController(this);

  render() {
    return html`
      <lion-form>
        <form>
          <lion-fieldset name="outer">
            <lion-fieldset name="range" .validators=${[new DateRangeInvalid()]}>
              <lion-input name="from" label="From" .validators=${[new Required()]} .modelValue=${'2026-01-01'}></lion-input>
              <lion-input name="to" label="To" .modelValue=${'2026-01-01'}></lion-input>
            </lion-fieldset>
          </lion-fieldset>
        </form>
      </lion-form>
    `;
  }
}
if (!customElements.get('test-fieldset-own-validator')) {
  customElements.define('test-fieldset-own-validator', TestFieldsetOwnValidator);
}

class TestCheckboxGroupOwnAndChild extends LitElement {
  readonly ctrl = new FormController(this);

  render() {
    return html`
      <lion-form>
        <form>
          <lion-checkbox-group name="tags[]" label="Tags" .validators=${[new MinTwoSelected()]}>
            <lion-checkbox label="X" .choiceValue=${'x'} .validators=${[new AlwaysFailCheckbox()]} .checked=${true}></lion-checkbox>
            <lion-checkbox label="Y" .choiceValue=${'y'}></lion-checkbox>
          </lion-checkbox-group>
        </form>
      </lion-form>
    `;
  }
}
if (!customElements.get('test-checkbox-own-and-child')) {
  customElements.define('test-checkbox-own-and-child', TestCheckboxGroupOwnAndChild);
}

class TestEmptyFormFocusOnError extends LitElement {
  readonly ctrl = new FormController(this, { focusOnError: true, scrollToError: true });

  render() {
    return html`
      <lion-form .validators=${[new AlwaysFailCheckbox()]}>
        <form></form>
      </lion-form>
    `;
  }
}
if (!customElements.get('test-empty-form-focus-on-error')) {
  customElements.define('test-empty-form-focus-on-error', TestEmptyFormFocusOnError);
}

class TestMultipleCheckboxGroups extends LitElement {
  readonly ctrl = new FormController(this);

  render() {
    return html`
      <lion-form>
        <form>
          <lion-checkbox-group name="tags[]" label="Tags 1" .validators=${[new Required()]}>
            <lion-checkbox label="A" .choiceValue=${'a'}></lion-checkbox>
          </lion-checkbox-group>
          <lion-checkbox-group name="tags[]" label="Tags 2" .validators=${[new MinTwoSelected()]}>
            <lion-checkbox label="B" .choiceValue=${'b'} .checked=${true}></lion-checkbox>
            <lion-checkbox label="C" .choiceValue=${'c'}></lion-checkbox>
          </lion-checkbox-group>
        </form>
      </lion-form>
    `;
  }
}
if (!customElements.get('test-multiple-checkbox-groups')) {
  customElements.define('test-multiple-checkbox-groups', TestMultipleCheckboxGroups);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FormController', () => {
  describe('validate() with lion-radio-group inside lion-fieldset', () => {
    let el: TestFormRadioInFieldset;

    beforeEach(async () => {
      el = document.createElement('test-form-radio-fieldset') as TestFormRadioInFieldset;
      document.body.appendChild(el);
      await el.updateComplete;
      await el.ctrl.form.registrationComplete;
      await aLittleMore();
    });

    afterEach(() => {
      el.remove();
    });

    it('isValid is false when required radio-group has no selection', async () => {
      const result = el.ctrl.validate();
      await aLittleMore();
      expect(result.isValid).to.be.false;
    });

    it('errors map has no numeric-index keys — only named field keys', async () => {
      const result = el.ctrl.validate();
      await aLittleMore();
      const numericKeys = Object.keys(result.errors).filter(k => !Number.isNaN(Number(k)));
      expect(numericKeys, `numeric keys leaked into errors: [${numericKeys}]`).to.deep.equal([]);
    });

    it('errors.group entry has non-empty validators when radio-group Required fails', async () => {
      const result = el.ctrl.validate();
      await aLittleMore();

      // The fieldset key 'group' must appear in errors because the radio-group inside fails.
      // Bug #2: #collectErrors must recurse into fieldset children to surface the correct
      // validator names — validators must NOT be [].
      const groupErr = (result.errors as any).group;
      expect(groupErr, 'errors.group should exist when nested radio-group Required fails').to.exist;
      expect(
        groupErr.validators,
        'Bug #2: validators[] must not be empty when Required fails on nested radio-group',
      ).to.not.be.empty;
      expect(groupErr.validators).to.include('Required');
    });

    it('errors.name has Required for the direct lion-input', async () => {
      const result = el.ctrl.validate();
      await aLittleMore();
      expect((result.errors as any).name).to.exist;
      expect((result.errors as any).name.validators).to.include('Required');
    });

    it('isValid is true after filling all required fields', async () => {
      el.ctrl.form.modelValue = { name: 'Alice', group: { choice: 'a' } };
      await aLittleMore();
      const result = el.ctrl.validate();
      await aLittleMore();
      expect(result.isValid).to.be.true;
    });
  });

  describe('validate() with lion-checkbox-group directly in lion-form', () => {
    let el: TestFormCheckboxDirect;

    beforeEach(async () => {
      el = document.createElement('test-form-checkbox') as TestFormCheckboxDirect;
      document.body.appendChild(el);
      await el.updateComplete;
      await el.ctrl.form.registrationComplete;
      await aLittleMore();
    });

    afterEach(() => {
      el.remove();
    });

    it('isValid is false when required checkbox-group has no selection', async () => {
      const result = el.ctrl.validate();
      await aLittleMore();
      expect(result.isValid).to.be.false;
    });

    it('errors.options has Required validator when no checkbox is selected', async () => {
      const result = el.ctrl.validate();
      await aLittleMore();
      expect((result.errors as any).options).to.exist;
      expect((result.errors as any).options.validators).to.include('Required');
    });

    it('errors map has no numeric-index keys', async () => {
      const result = el.ctrl.validate();
      await aLittleMore();
      const numericKeys = Object.keys(result.errors).filter(k => !Number.isNaN(Number(k)));
      expect(numericKeys).to.deep.equal([]);
    });
  });

  describe('validate() with validators directly on lion-form, lion-fieldset, lion-checkbox-group', () => {
    it('captures own validator failing on lion-form in result.formErrors without FormElementsHaveNoError', async () => {
      const el = document.createElement('test-form-own-validator') as TestFormOwnValidator;
      document.body.appendChild(el);
      await el.updateComplete;
      await el.ctrl.form.registrationComplete;
      await aLittleMore();

      const result = el.ctrl.validate();
      el.remove();

      expect(result.isValid).to.be.false;
      expect(result.errors).to.deep.equal({});
      expect(result.formErrors).to.deep.equal({ validators: ['CrossFieldMismatch'] });
    });

    it('omits formErrors when only child fields fail or form is valid', async () => {
      const el = document.createElement('test-form-own-validator') as TestFormOwnValidator;
      document.body.appendChild(el);
      await el.updateComplete;
      await el.ctrl.form.registrationComplete;
      await aLittleMore();

      el.ctrl.form.modelValue = { a: 'same', b: 'same' };
      await aLittleMore();
      const result = el.ctrl.validate();
      el.remove();

      expect(result.isValid).to.be.true;
      expect(result.formErrors).to.be.undefined;
    });

    it('captures own validator on nested lion-fieldset alone and combined with child validators', async () => {
      const el = document.createElement('test-fieldset-own-validator') as TestFieldsetOwnValidator;
      document.body.appendChild(el);
      await el.updateComplete;
      await el.ctrl.form.registrationComplete;
      await aLittleMore();

      const onlyFieldset = el.ctrl.validate();
      expect(onlyFieldset.isValid).to.be.false;
      expect((onlyFieldset.errors as any).outer?.validators).to.include('DateRangeInvalid');
      expect((onlyFieldset.errors as any).outer?.validators).to.not.include('FormElementsHaveNoError');

      el.ctrl.form.modelValue = { outer: { range: { from: '', to: '' } } };
      await aLittleMore();
      const both = el.ctrl.validate();
      el.remove();

      expect(both.isValid).to.be.false;
      expect((both.errors as any).outer?.validators).to.include('DateRangeInvalid');
      expect((both.errors as any).outer?.validators).to.include('Required');
      expect((both.errors as any).outer?.validators).to.not.include('FormElementsHaveNoError');
    });

    it('captures both own and child checkbox validators on lion-checkbox-group without FormElementsHaveNoError', async () => {
      const el = document.createElement('test-checkbox-own-and-child') as TestCheckboxGroupOwnAndChild;
      document.body.appendChild(el);
      await el.updateComplete;
      await el.ctrl.form.registrationComplete;
      await aLittleMore();

      const result = el.ctrl.validate();
      el.remove();

      expect(result.isValid).to.be.false;
      const validators = (result.errors as any)['tags[]']?.validators ?? [];
      expect(validators).to.include('MinTwoSelected');
      expect(validators).to.include('AlwaysFailCheckbox');
      expect(validators).to.not.include('FormElementsHaveNoError');
    });

    it('does not throw with focusOnError/scrollToError when only lion-form fails with no focusable children', async () => {
      const el = document.createElement('test-empty-form-focus-on-error') as TestEmptyFormFocusOnError;
      document.body.appendChild(el);
      await el.updateComplete;
      await el.ctrl.form.registrationComplete;
      await aLittleMore();

      const result = el.ctrl.validate();
      el.remove();

      expect(result.isValid).to.be.false;
      expect(result.formErrors?.validators).to.include('AlwaysFailCheckbox');
    });

    it('aggregates validators across multiple failing groups sharing a [] name', async () => {
      const el = document.createElement('test-multiple-checkbox-groups') as TestMultipleCheckboxGroups;
      document.body.appendChild(el);
      await el.updateComplete;
      await el.ctrl.form.registrationComplete;
      await aLittleMore();

      const result = el.ctrl.validate();
      el.remove();

      expect(result.isValid).to.be.false;
      expect((result.errors as any)['tags[]']?.validators).to.include('Required');
      expect((result.errors as any)['tags[]']?.validators).to.include('MinTwoSelected');
    });

    it('returns isValid false when form validationStates.error has own validator even if hasFeedbackFor is empty', async () => {
      const host = Object.assign(document.createElement('div'), {
        addController() {},
      }) as unknown as LitElement;
      const fakeForm = Object.assign(document.createElement('div'), {
        hasFeedbackFor: [] as string[],
        validationStates: { error: { FormLevelRule: true } },
        formElements: Object.assign([] as any[], {}),
        submitGroup() {},
        resetGroup() {},
        modelValue: {},
        serializedValue: {},
      });
      const ctrl = new FormController(host, {
        form: fakeForm as any,
      });

      const result = ctrl.validate();

      expect(result.isValid).to.be.false;
      expect(result.errors).to.deep.equal({});
      expect(result.formErrors).to.deep.equal({ validators: ['FormLevelRule'] });
    });
  });
});

