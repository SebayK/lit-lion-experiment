import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import type { ProcessController } from '../controllers/process-controller.js';
import { processContext } from '../context.js';
import { StoreController } from '../../../shared/store/StoreController.js';
import { selectClientProfile } from '../../client-profile/store/client-profile-slice.js';
import { selectIncomeItems, selectTotalIncome } from '../../income/store/income-slice.js';
import { selectCalculation } from '../../calculation/store/calculation-slice.js';

@customElement('dashboard-step-page')
export class DashboardStepPage extends LitElement {
  @consume({ context: processContext, subscribe: true })
  @state()
  private processCtrl?: ProcessController;

  private storeCtrl = new StoreController(this);

  static styles = css`
    :host {
      display: block;
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .dashboard-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 2.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      max-width: 750px;
      margin: 0 auto;
    }

    h2 {
      margin-top: 0;
      color: #0f172a;
      font-size: 1.75rem;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 0.75rem;
    }

    .success-banner {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      text-align: center;
    }

    .success-banner h3 {
      margin: 0 0 0.5rem 0;
      color: #15803d;
      font-size: 1.5rem;
    }

    .success-banner p {
      margin: 0;
      color: #166534;
    }

    .summary-section {
      margin-bottom: 2rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
    }

    .summary-section h3 {
      color: #1e293b;
      font-size: 1.15rem;
      margin-top: 0;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    dl {
      margin: 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    dt {
      font-weight: 600;
      color: #64748b;
      font-size: 0.875rem;
    }

    dd {
      margin: 0;
      color: #0f172a;
      font-weight: 500;
      font-size: 1.05rem;
    }

    .highlight-value {
      color: #2563eb;
      font-size: 1.35rem;
      font-weight: 700;
    }

    .incomes-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .income-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.6rem 1rem;
      font-size: 0.95rem;
    }

    .income-source-name {
      font-weight: 600;
      color: #334155;
    }

    .income-amount {
      font-weight: 700;
      color: #16a34a;
    }

    .error-state {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 1.5rem;
      text-align: center;
      color: #991b1b;
    }

    .actions {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
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

    .btn-primary {
      background: #2563eb;
      color: white;
    }

    .btn-primary:hover {
      background: #1d4ed8;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    }
  `;

  private _handleReset(): void {
    this.processCtrl?.reset();
    this.dispatchEvent(
      new CustomEvent("request-navigate", {
        detail: "/process/calculation",
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleBack(): void {
    this.dispatchEvent(
      new CustomEvent("request-navigate", {
        detail: "/process/phone-verification",
        bubbles: true,
        composed: true,
      })
    );
  }

  private _formatMaritalStatus(status: string): string {
    switch (status) {
      case 'single': return 'Kawaler / Panna';
      case 'married': return 'Żonaty / Mężatka';
      case 'divorced': return 'Rozwiedziony / Rozwiedziona';
      case 'widowed': return 'Wdowiec / Wdowa';
      default: return status;
    }
  }

  render() {
    if (!this.processCtrl) {
      return html`
        <div class="error-state">
          <p>Nie można załadować stanu procesu.</p>
          <a href="/process">Powrót do początku</a>
        </div>
      `;
    }

    const calcFromStore = selectCalculation(this.storeCtrl.state);
    const profile = selectClientProfile(this.storeCtrl.state);
    const incomes = selectIncomeItems(this.storeCtrl.state);
    const totalIncome = selectTotalIncome(this.storeCtrl.state);
    const { email, phone } = this.processCtrl;

    return html`
      <div class="dashboard-card">
        <div class="success-banner">
          <h3>🎉 Wniosek skompletowany pomyślnie!</h3>
          <p>Wszystkie etapy formularza i slice'y Redux zostały pomyślnie przetworzone.</p>
        </div>

        <h2>Podsumowanie wniosku</h2>

        <!-- Calculation Slice -->
        <div class="summary-section">
          <h3>📊 Kalkulacja Kredytu (Calculation Slice)</h3>
          <dl>
            <dt>Kwota kredytu:</dt>
            <dd class="highlight-value">${calcFromStore?.loanAmount?.toLocaleString('pl-PL')} zł</dd>
            
            <dt>Okres kredytowania:</dt>
            <dd>${calcFromStore?.periodMonths} miesięcy</dd>
            
            <dt>Szacowana rata:</dt>
            <dd class="highlight-value">${calcFromStore?.monthlyInstallment?.toFixed(2)} zł/mc</dd>
          </dl>
        </div>

        <!-- Client Profile Slice -->
        <div class="summary-section">
          <h3>👤 Profil Klienta (Client Profile Slice)</h3>
          <dl>
            <dt>Stan cywilny:</dt>
            <dd>${this._formatMaritalStatus(profile.maritalStatus)}</dd>
            
            <dt>Osoby na utrzymaniu:</dt>
            <dd>${profile.dependentsCount} osób</dd>
            
            <dt>Działalność gospodarcza (B2B):</dt>
            <dd>${profile.hasBusinessActivity ? '✅ Tak' : '❌ Nie'}</dd>
          </dl>
        </div>

        <!-- Incomes Slice -->
        <div class="summary-section">
          <h3>💰 Dochody (Incomes Slice)</h3>
          ${incomes.length === 0
            ? html`<p style="color: #64748b; margin: 0;">Brak zadeklarowanych dochodów.</p>`
            : html`
              <ul class="incomes-list">
                ${incomes.map(
                  (inc) => html`
                    <li class="income-row">
                      <span class="income-source-name">🏷️ ${inc.source}</span>
                      <span class="income-amount">+${Number(inc.amount).toLocaleString('pl-PL')} ${inc.currency || 'PLN'}/mc</span>
                    </li>
                  `
                )}
              </ul>
              <div style="margin-top: 1rem; text-align: right; font-weight: 700; color: #1e293b; font-size: 1.1rem;">
                Łączny dochód netto: <span style="color: #16a34a;">${totalIncome.toLocaleString('pl-PL')} PLN/mc</span>
              </div>
            `}
        </div>

        <!-- Contact Data -->
        <div class="summary-section">
          <h3>📱 Dane Kontaktowe</h3>
          <dl>
            <dt>Email:</dt>
            <dd>${email || '-'}</dd>
            
            <dt>Telefon:</dt>
            <dd>${phone || '-'}</dd>
          </dl>
        </div>

        <div class="actions">
          <button type="button" class="btn btn-secondary" @click=${this._handleBack}>
            &larr; Wstecz
          </button>
          <button type="button" class="btn btn-primary" @click=${this._handleReset}>
            Rozpocznij nowy proces
          </button>
        </div>
      </div>
    `;
  }
}

