import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { Income, IncomeStepConfig } from '../types.js';
import { IncomeStepController } from '../controllers/income-step-controller.js';

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

  private readonly incomeController = new IncomeStepController(this);

  @state() private _invalidIncomeId?: string;

  /**
   * Domain/store-level step validation: every income in the store is checked
   * headlessly against the Income Specification. The first incomplete income
   * gets its dialog auto-opened so the user can fix it immediately.
   *
   * @returns `true` when all incomes are complete.
   */
  validateStep(): boolean {
    const invalid = this.incomeController.firstIncomplete(this.config);
    this._invalidIncomeId = invalid?.id;
    return !invalid;
  }

  private handleSave(e: CustomEvent<Income>) {
    this.incomeController.save(e.detail);
  }

  private handleDelete(e: CustomEvent<string>) {
    this.incomeController.delete(e.detail);
  }

  render() {
    const incomes = this.incomeController.incomes;

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
