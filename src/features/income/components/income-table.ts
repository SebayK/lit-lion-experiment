import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { ref, createRef } from 'lit/directives/ref.js';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { Income } from '../types.js';
import { IncomeDialog } from './income-dialog.js';

import { LionFieldset } from '@lion/ui/fieldset.js';
import { LionButton } from '@lion/ui/button.js';

export class IncomeTable extends ScopedElementsMixin(LitElement) {
  static get scopedElements() {
    return {
      'income-dialog': IncomeDialog,
      'lion-fieldset': LionFieldset,
      'lion-button': LionButton,
    };
  }

  static styles = css`
    :host {
      display: block;
      margin-bottom: 2rem;
    }
    .table-container {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }
    .table-container th, .table-container td {
      border: 1px solid #ddd;
      padding: 12px 8px;
      text-align: left;
    }
    .table-container th {
      background-color: #f2f2f2;
    }
    .actions {
      display: flex;
      gap: 0.5rem;
    }
    .empty-state {
      padding: 2rem;
      text-align: center;
      color: #666;
      border: 1px dashed #ccc;
      margin-top: 1rem;
      border-radius: 4px;
    }
  `;

  @property({ type: Array }) incomes: Income[] = [];
  @property({ type: Object }) config?: any;

  private _fieldsetRef = createRef<any>();

  private _incomesToModelValue(incomes: Income[]): Record<string, Income> {
    return incomes.reduce((acc, income) => {
      acc[income.id] = income;
      return acc;
    }, {} as Record<string, Income>);
  }

  async updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('incomes')) {
      await this.updateComplete;
      const fieldset = this._fieldsetRef.value;
      if (fieldset) {
        fieldset.modelValue = this._incomesToModelValue(this.incomes);
      }
    }
  }

  private handleDelete(id: string) {
    this.dispatchEvent(new CustomEvent('delete', {
      detail: id,
      bubbles: true,
      composed: true
    }));
  }

  private formatSource(source: string) {
    const map: Record<string, string> = {
      'umowa_o_prace': 'Umowa o pracę',
      'zlecenie': 'Umowa zlecenie',
      'inne': 'Inne'
    };
    return map[source] || source;
  }

  private formatDuration(duration: any) {
    if (!duration) return '-';
    if (duration.type === 'okreslony' && duration.endDate) {
      return `Określony (do ${new Date(duration.endDate).toLocaleDateString()})`;
    }
    return 'Nieokreślony';
  }

  render() {
    return html`
      <lion-fieldset ${ref(this._fieldsetRef)} name="incomesList" label="Wykaz Dochodów">
        ${this.incomes.length === 0
          ? html`<div class="empty-state">Brak dochodów. Dodaj nowy, używając przycisku poniżej.</div>`
          : html`
            <table class="table-container">
              <thead>
                <tr>
                  <th>Źródło</th>
                  <th>Czas trwania</th>
                  <th>Kwota</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                ${this.incomes.map(income => html`
                  <tr>
                    <td>${this.formatSource(income.source)}</td>
                    <td>${this.formatDuration(income.durationDetails)}</td>
                    <td>${income.amount} PLN</td>
                     <td class="actions">
                      <income-dialog .config="${this.config}" .income="${income}" invokerText="Edytuj" @save="${(e: CustomEvent) => this.dispatchEvent(new CustomEvent('save', { detail: e.detail, bubbles: true, composed: true }))}"></income-dialog>
                      <lion-button variant="danger" @click="${() => this.handleDelete(income.id)}">Usuń</lion-button>
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>
          `}
      </lion-fieldset>
    `;
  }
}
