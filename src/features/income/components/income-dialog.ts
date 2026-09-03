import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { FormController } from '../../../shared/controllers/FormController.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { Income, IncomeStepConfig } from '../types.js';
import { IncomeSchemaEngine, FieldDefinition } from '../engine/income-schema-engine.js';
import { saveIncomeApi } from '../api/income-api.js';


import { LionDialog } from '@lion/ui/dialog.js';
import { LionButton } from '@lion/ui/button.js';
import { LionForm } from '@lion/ui/form.js';
import { LionInputAmount } from '@lion/ui/input-amount.js';
import { LionInput } from '@lion/ui/input.js';
import { LionSelect } from '@lion/ui/select.js';
import { LionRadioGroup, LionRadio } from '@lion/ui/radio-group.js';
import { LionCheckboxGroup, LionCheckbox } from '@lion/ui/checkbox-group.js';
import { LionInputDatepicker } from '@lion/ui/input-datepicker.js';
import { LionFieldset } from '@lion/ui/fieldset.js';
import { Required } from '@lion/ui/form-core.js';

/**
 * Typed shape of the income form's `modelValue`.
 * Keys match the `name` attributes of lion form fields.
 */
interface IncomeFormValues extends Record<string, unknown> {
  source: string;
  amount: number | string;
  currency: string;
  durationDetails: {
    type: 'okreslony' | 'nieokreslony' | '';
    endDate?: string;
  };
  paymentMethod: string[];
}

export class IncomeDialog extends ScopedElementsMixin(LitElement) {
  static get scopedElements() {
    return {
      'lion-dialog': LionDialog,
      'lion-button': LionButton,
      'lion-form': LionForm,
      'lion-input-amount': LionInputAmount,
      'lion-input': LionInput,
      'lion-select': LionSelect,
      'lion-radio-group': LionRadioGroup,
      'lion-radio': LionRadio,
      'lion-checkbox-group': LionCheckboxGroup,
      'lion-checkbox': LionCheckbox,
      'lion-input-datepicker': LionInputDatepicker,
      'lion-fieldset': LionFieldset
    };
  }

  static styles = css`
    :host {
      display: block;
    }
    .form-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
      border-top: 1px solid #eee;
      padding-top: 1rem;
    }
    .dialog-content {
      padding: 1.5rem;
      background: white;
      border-radius: 8px;
      min-width: 400px;
    }
    .dynamic-section {
      margin-top: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
  `;

  @property({ type: Object }) income?: Income;
  @property({ type: Boolean }) opened = false;
  @property({ type: String }) invokerText = 'Dodaj Dochód';
  @property({ type: Object }) config?: IncomeStepConfig;

  @state() private _source = '';
  @state() private _durationType = '';
  @state() private _isSaving = false;
  @state() private _errorMessage = '';


  /**
   * FormController discovers <lion-form> via `this.renderRoot.querySelector('lion-form')`
   * — no explicit ref needed even with ScopedElementsMixin.
   * focusOnError delegates to LionForm._setFocusOnFirstErroneousFormElement;
   * scrollToError adds scrollIntoView on top.
   */
  readonly #formCtrl = new FormController<IncomeFormValues>(this, {
    focusOnError: true,
    scrollToError: true,
    onValidate: (result) => {
      console.group('📋 [FormController] Validation Result');
      console.log('isValid:', result.isValid);
      console.log('errors:', result.errors);
      console.groupEnd();
    },
  });

  async updated(changedProperties: Map<string, any>) {
    const openedChanged = changedProperties.has('opened');
    const incomeChanged = changedProperties.has('income');

    const shouldSync =
      (openedChanged && this.opened) ||
      (incomeChanged && this.opened && this.income != null);

    if (shouldSync) {
      if (this.income) {
        this._source = this.income.source || '';
        this._durationType = this.income.durationDetails?.type || '';
        await this.updateComplete;
        this.#formCtrl.form.modelValue = IncomeSchemaEngine.mapIncomeToFormValue(this.income, this.config);
      } else if (openedChanged) {
        this._source = '';
        this._durationType = '';
        await this.updateComplete;
        this.#formCtrl.form.resetGroup();
      }
    }
  }

  private async _handleSourceChange(ev: Event) {
    const newSource = (ev.target as any).modelValue;
    if (!newSource || newSource === this._source) return;

    this._source = newSource;
    this._durationType = '';

    await this.updateComplete;

    this.#formCtrl.form.modelValue = IncomeSchemaEngine.getEmptyFormValue(newSource, this.config);
  }

  private async _handleDurationChange(ev: Event) {
    const newType = (ev.target as any).modelValue;
    if (!newType || newType === this._durationType) return;

    this._durationType = newType;

    await this.updateComplete;

    const current = this.#formCtrl.form.modelValue;
    this.#formCtrl.form.modelValue = {
      ...current,
      durationDetails: { type: newType },
    };
  }

  private async _handleSubmitClick(ev: Event) {
    ev.preventDefault();

    console.group('🚀 [IncomeDialog] Submitting Form');
    const validation = this.#formCtrl.validate();
    const form = this.#formCtrl.form;

    console.log('Form modelValue:', form.modelValue);
    console.log('Form serializedValue:', form.serializedValue);

    if (!validation.isValid) {
      console.warn('❌ Form validation failed! Errors:', validation.errors);
      console.groupEnd();
      return;
    }

    const raw = form.serializedValue;
    const newIncome = IncomeSchemaEngine.mapFormToIncome(raw, this.income, this.config);

    console.log('✅ Form valid! Sending POST /api/income...', newIncome);
    
    this._isSaving = true;
    this._errorMessage = '';

    try {
      const savedIncome = await saveIncomeApi(newIncome);

      console.log('✅ API returned saved Income object:', savedIncome);
      console.groupEnd();

      this.dispatchEvent(new CustomEvent('save', {
        detail: savedIncome,
        bubbles: true,
        composed: true,
      }));

      this.opened = false;

      if (!this.income) {
        form.resetGroup();
        this._source = '';
        this._durationType = '';
      }
    } catch (err) {
      console.error('❌ Failed to save income via API:', err);
      console.groupEnd();
      this._errorMessage = 'Nie udało się zapisać dochodu. Spróbuj ponownie.';
    } finally {
      this._isSaving = false;
    }
  }


  private _handleClose() {
    this.opened = false;
  }

  private _renderField(field: FieldDefinition) {
    if (field.type === 'amount') {
      return html`
        <lion-input-amount
          name="${field.name}"
          label="${field.label}"
          .validators="${field.validators}"
        ></lion-input-amount>
      `;
    }
    
    // Fallback do zwykłego inputa
    return html`
      <lion-input
        name="${field.name}"
        label="${field.label}"
        .validators="${field.validators}"
      ></lion-input>
    `;
  }

  render() {
    const sourceOptions = this.config?.availableSources || [];
    const dynamicFields = IncomeSchemaEngine.getFieldsForSource(this.config, this._source);

    return html`
      <lion-dialog
        .opened="${this.opened}"
        @opened-changed="${(e: CustomEvent) => { this.opened = e.detail.opened; }}"
      >
        <lion-button slot="invoker">${this.invokerText}</lion-button>
        <div slot="content" class="dialog-content">
          <h3>${this.income ? 'Edytuj Dochód' : 'Dodaj Dochód'}</h3>

          <lion-form>
            <form>

              <lion-select
                name="source"
                label="Źródło dochodu"
                .validators="${[new Required()]}"
                @model-value-changed="${this._handleSourceChange}"
              >
                <select slot="input">
                  <option value="">Wybierz...</option>
                  ${sourceOptions.map(option => html`
                    <option value="${option.sourceId}">${option.label}</option>
                  `)}
                </select>
              </lion-select>

              ${this._source ? html`
                <div class="dynamic-section">

                  ${dynamicFields.map(field => this._renderField(field))}

                  <lion-input-amount
                    name="amount"
                    label="Kwota"
                    .validators="${IncomeSchemaEngine.getValidatorsForField(this.config, this._source, 'amount')}"
                  ></lion-input-amount>
                  
                  <lion-select
                    name="currency"
                    label="Waluta"
                    .validators="${IncomeSchemaEngine.getValidatorsForField(this.config, this._source, 'currency')}"
                  >
                    <select slot="input">
                      <option value="PLN">PLN</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </lion-select>

                  <lion-fieldset name="durationDetails">
                    <lion-radio-group
                      name="type"
                      label="Czas trwania"
                      .validators="${[new Required()]}"
                      @model-value-changed="${this._handleDurationChange}"
                    >
                      <lion-radio label="Określony"   .choiceValue="${'okreslony'}"></lion-radio>
                      <lion-radio label="Nieokreślony" .choiceValue="${'nieokreslony'}"></lion-radio>
                    </lion-radio-group>

                    ${this._durationType === 'okreslony' ? html`
                      <lion-input-datepicker
                        name="endDate"
                        label="Data końcowa"
                        .validators="${[new Required()]}"
                      ></lion-input-datepicker>
                    ` : ''}
                  </lion-fieldset>

                  <lion-checkbox-group
                    name="paymentMethod"
                    label="Metoda płatności"
                    .validators="${[new Required()]}"
                  >
                    <lion-checkbox label="Przelew" .choiceValue="${'przelew'}"></lion-checkbox>
                    <lion-checkbox label="Gotówka" .choiceValue="${'gotowka'}"></lion-checkbox>
                  </lion-checkbox-group>

                </div>
              ` : ''}

              ${this._errorMessage ? html`
                <div style="color: #dc2626; background: #fef2f2; border: 1px solid #fca5a5; padding: 0.75rem; border-radius: 6px; margin-top: 1rem; font-size: 0.875rem;">
                  ${this._errorMessage}
                </div>
              ` : ''}

              <div class="form-buttons">
                <lion-button type="button" ?disabled="${this._isSaving}" @click="${this._handleClose}">Anuluj</lion-button>
                <lion-button variant="primary" ?disabled="${this._isSaving}" @click="${this._handleSubmitClick}">
                  ${this._isSaving ? 'Zapisywanie...' : 'Zapisz'}
                </lion-button>
              </div>

            </form>
          </lion-form>
        </div>
      </lion-dialog>
    `;
  }

}
