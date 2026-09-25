import { expect } from '@esm-bundle/chai';
import { LitElement, html } from 'lit';
import { LionForm } from '@lion/ui/form.js';
import { LionFieldset } from '@lion/ui/fieldset.js';
import { LionRadioGroup, LionRadio } from '@lion/ui/radio-group.js';
import { LionCheckboxGroup, LionCheckbox } from '@lion/ui/checkbox-group.js';
import { LionInput } from '@lion/ui/input.js';
import { Required } from '@lion/ui/form-core.js';
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
});

