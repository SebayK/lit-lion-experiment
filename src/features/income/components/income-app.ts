import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { StoreController } from '../../../shared/store/StoreController.js';
import { store } from '../../../shared/store/index.js';
import { addIncome, updateIncome, deleteIncome } from '../store/income-slice.js';
import { Income, IncomeStepConfig } from '../types.js';
import { ValidationEngine } from '../domain/validation-engine.js';

import { IncomeTable } from './income-table.js';
import { IncomeDialog } from './income-dialog.js';

@customElement('income-app')
export class IncomeApp extends ScopedElementsMixin(LitElement) {
  @property({ type: Object }) config?: IncomeStepConfig;

  static get scopedElements() {
    return {
      'income-table': IncomeTable,
      'income-dialog': IncomeDialog,
    };
  }

  static styles = css`
    :host {
      display: block;
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    h1 {
      margin-top: 0;
      color: #333;
    }
    .footer-actions {
      margin-top: 2rem;
      display: flex;
      justify-content: flex-end;
    }
  `;

  private store = new StoreController(this);

  @state() private _invalidIncomeId?: string;

  /**
   * Domain/store-level step validation: every income in the store is checked
   * headlessly against the Income Specification. The first incomplete income
   * gets its dialog auto-opened so the user can fix it immediately.
   *
   * @returns `true` when all incomes are complete.
   */
  validateStep(): boolean {
    const incomes = this.store.state.incomes.items;
    const invalid = incomes.find(income => !ValidationEngine.isIncomeValid(income, this.config));
    this._invalidIncomeId = invalid?.id;
    return !invalid;
  }

  private handleSave(e: CustomEvent<Income>) {
    const income = e.detail;
    const isExisting = this.store.state.incomes.items.some(i => i.id === income.id);
    
    if (isExisting) {
      store.dispatch(updateIncome(income));
    } else {
      store.dispatch(addIncome(income));
    }
  }

  private handleDelete(e: CustomEvent<string>) {
    store.dispatch(deleteIncome(e.detail));
  }

  render() {
    const incomes = this.store.state.incomes.items;

    return html`
      <h1>Zarządzanie Dochodami</h1>
      
      <income-table
        .config="${this.config}"
        .incomes="${incomes}"
        .invalidIncomeId="${this._invalidIncomeId}"
        @auto-open-handled="${() => { this._invalidIncomeId = undefined; }}"
        @save="${this.handleSave}"
        @delete="${this.handleDelete}"
      ></income-table>

      <div class="footer-actions">
        <income-dialog 
          invokerText="Dodaj Kolejny Dochód"
          .config="${this.config}"
          @save="${this.handleSave}"
        ></income-dialog>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'income-app': IncomeApp;
  }
}
