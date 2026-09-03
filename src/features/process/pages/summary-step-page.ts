import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { StoreController } from '../../../shared/store/StoreController.js';

@customElement('summary-step-page')
export class SummaryStepPage extends LitElement {
  private store = new StoreController(this);
  @state() private completed = false;

  static styles = css`
    :host {
      display: block;
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .summary-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 2.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      max-width: 700px;
      margin: 0 auto;
    }

    h2 {
      margin-top: 0;
      color: #0f172a;
      font-size: 1.75rem;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 0.75rem;
    }

    .income-summary-list {
      margin: 1.5rem 0;
      padding: 0;
      list-style: none;
    }

    .income-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.875rem 1rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 0.5rem;
    }

    .income-item-title {
      font-weight: 600;
      color: #1e293b;
    }

    .income-item-amount {
      font-weight: 700;
      color: #16a34a;
    }

    .empty-state {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      color: #b45309;
      padding: 1rem;
      border-radius: 8px;
      margin: 1.5rem 0;
    }

    .success-banner {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #15803d;
      padding: 1.5rem;
      border-radius: 12px;
      text-align: center;
      margin-top: 1.5rem;
    }

    .success-banner h3 {
      margin: 0 0 0.5rem 0;
    }

    .nav-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e2e8f0;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
      border: none;
      font-size: 1rem;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #cbd5e1;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    .btn-success {
      background: #16a34a;
      color: white;
    }

    .btn-success:hover {
      background: #15803d;
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.25);
    }
  `;

  private _handleBack() {
    this.dispatchEvent(
      new CustomEvent("request-navigate", {
        detail: "/process/income",
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleComplete() {
    this.completed = true;
  }

  render() {
    const incomes = this.store.state.incomes.items;

    return html`
      <div class="summary-card">
        <h2>Podsumowanie Wniosku</h2>

        <p>Przejrzyj zadeklarowane dochody przed wysłaniem wniosku:</p>

        ${incomes.length > 0
          ? html`
              <ul class="income-summary-list">
                ${incomes.map(
                  (inc) => html`
                    <li class="income-item">
                      <span class="income-item-title">${inc.source}</span>
                      <span class="income-item-amount">${inc.amount} PLN</span>
                    </li>
                  `
                )}
              </ul>
            `
          : html`
              <div class="empty-state">
                ⚠️ Nie zadeklarowano jeszcze żadnych źródeł dochodu. Możesz wrócic do poprzedniego kroku.
              </div>
            `}

        ${this.completed
          ? html`
              <div class="success-banner">
                <h3>🎉 Wniosek został pomyślnie złożony!</h3>
                <p>Dziękujemy za złożenie wniosku. Wkrótce się z Tobą skontaktujemy.</p>
                <a href="/" class="btn btn-secondary" style="margin-top: 1rem;">Powrót do Strony Głównej</a>
              </div>
            `
          : html`
              <div class="nav-actions">
                <button type="button" class="btn btn-secondary" @click=${this._handleBack}>
                  &larr; Wstecz do Dochodów
                </button>
                <button type="button" @click="${this.handleComplete}" class="btn btn-success">
                  Złóż Wniosek &#10003;
                </button>
              </div>
            `}
      </div>
    `;
  }
}
