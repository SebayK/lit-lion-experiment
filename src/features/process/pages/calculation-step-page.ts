import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import type { ProcessController } from '../controllers/process-controller.js';
import { processContext } from '../context.js';
import type { CalculationData } from '../types.js';

@customElement('calculation-step-page')
export class CalculationStepPage extends LitElement {
  @consume({ context: processContext, subscribe: true })
  @state()
  private processCtrl?: ProcessController;

  @state()
  private loanAmount: number = 10000;

  @state()
  private periodMonths: number = 12;

  @state()
  private monthlyInstallment: number = 0;

  static styles = css`
    :host {
      display: block;
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .calculation-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 2.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      max-width: 600px;
      margin: 0 auto;
    }

    h2 {
      margin-top: 0;
      color: #0f172a;
      font-size: 1.75rem;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 0.75rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      font-weight: 600;
      color: #334155;
      margin-bottom: 0.5rem;
    }

    input[type="number"] {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    input[type="number"]:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .result-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 1rem;
      margin: 1.5rem 0;
    }

    .result-label {
      font-size: 0.875rem;
      color: #1e40af;
      margin-bottom: 0.25rem;
    }

    .result-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e40af;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
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

    .btn-primary {
      background: #2563eb;
      color: white;
    }

    .btn-primary:hover {
      background: #1d4ed8;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    }
  `;

  private _calculateInstallment(): void {
    // Simplified installment calculation (equal installments)
    // Real calculation would include interest rate
    const interestRate = 0.05; // 5% annual interest rate
    const monthlyRate = interestRate / 12;
    const n = this.periodMonths;
    
    if (monthlyRate === 0) {
      this.monthlyInstallment = this.loanAmount / n;
    } else {
      this.monthlyInstallment = this.loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    }
    
    this.monthlyInstallment = Math.round(this.monthlyInstallment * 100) / 100;
  }

  private _handleLoanAmountChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.loanAmount = Number(input.value);
    this._calculateInstallment();
  }

  private _handlePeriodChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.periodMonths = Number(input.value);
    this._calculateInstallment();
  }

  private _handleComplete(): void {
    const data: CalculationData = {
      loanAmount: this.loanAmount,
      periodMonths: this.periodMonths,
      monthlyInstallment: this.monthlyInstallment,
    };

    this.processCtrl?.completeCalculation(data);

    this.dispatchEvent(
      new CustomEvent("request-navigate", {
        detail: "/email-verification",
        bubbles: true,
        composed: true,
      })
    );
  }

  connectedCallback() {
    super.connectedCallback();
    this._calculateInstallment();
    console.log(processContext)
  }

  render() {
    return html`
      <div class="calculation-card">
        <h2>Kalkulacja kredytu</h2>
        
        <p>Wypełnij poniższe pola, aby obliczyć swoją miesięczną ratę.</p>

        <div class="form-group">
          <label for="loanAmount">Kwota kredytu (zł)</label>
          <input
            id="loanAmount"
            type="number"
            min="1000"
            max="100000"
            step="1000"
            .value=${String(this.loanAmount)}
            @input=${this._handleLoanAmountChange}
          />
        </div>

        <div class="form-group">
          <label for="period">Okres kredytowania (miesiące)</label>
          <input
            id="period"
            type="number"
            min="6"
            max="120"
            step="6"
            .value=${String(this.periodMonths)}
            @input=${this._handlePeriodChange}
          />
        </div>

        <div class="result-box">
          <div class="result-label">Twoja miesięczna rata:</div>
          <div class="result-value">${this.monthlyInstallment.toFixed(2)} zł</div>
        </div>

        <div class="actions">
          <button type="button" class="btn btn-primary" @click=${this._handleComplete}>
            Przejdź dalej &rarr;
          </button>
        </div>
      </div>
    `;
  }
}
