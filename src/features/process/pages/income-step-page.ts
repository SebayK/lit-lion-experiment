import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import '../../../features/income/index.js';
import type { IncomeStepConfig } from '../../../features/income/index.js';
import type { ProcessController } from '../controllers/process-controller.js';
import { processContext } from '../context.js';

export const defaultMockConfig: IncomeStepConfig = {
  availableSources: [
    {
      sourceId: 'umowa_o_prace',
      label: 'Umowa o Pracę',
      fields: [
        {
          name: 'companyName',
          label: 'Nazwa pracodawcy',
          type: 'input',
          required: true,
          placeholder: 'Wpisz nazwę pracodawcy'
        },
        {
          name: 'nip',
          label: 'NIP pracodawcy',
          type: 'input',
          required: true,
          placeholder: 'Wpisz NIP (10 cyfr)'
        }
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
        {
          name: 'childrenCount',
          label: 'Liczba dzieci',
          type: 'amount',
          required: true,
          placeholder: 'Liczba dzieci (minimum 1)'
        }
      ],
      validations: {
        amount: { min: 800, max: 800, required: true },
        childrenCount: { min: 1, required: true }
      }
    }
  ]
};

@customElement('income-step-page')
export class IncomeStepPage extends LitElement {
  @consume({ context: processContext, subscribe: true })
  @state()
  private processCtrl?: ProcessController;

  @property({ type: Object }) config: IncomeStepConfig = defaultMockConfig;

  static styles = css`
    :host {
      display: block;
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .wrapper {
      max-width: 900px;
      margin: 0 auto;
    }

    .nav-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 2rem;
      padding: 1rem 0;
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

  private _handleBack() {
    this.dispatchEvent(
      new CustomEvent("request-navigate", {
        detail: "/process",
        bubbles: true,
        composed: true,
      })
    );
  }

  connectedCallback() {
    super.connectedCallback();
    console.log('📍 [IncomeStepPage] connectedCallback');
  }

  protected updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);
    
    if (changedProperties.has('processCtrl')) {
      console.group('📍 [IncomeStepPage] processCtrl Updated');
      console.log('processCtrl:', this.processCtrl);
      console.log('Is available:', !!this.processCtrl);
      if (this.processCtrl) {
        console.log('calculationData:', this.processCtrl.calculationData);
        console.log('stepStatuses:', this.processCtrl.stepStatuses);
        console.log('email:', this.processCtrl.email);
        console.log('phone:', this.processCtrl.phone);
      }
      console.groupEnd();
    }
  }

  private _handleNext() {
    this.dispatchEvent(
      new CustomEvent("request-navigate", {
        detail: "/process/summary",
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    return html`
      <div class="wrapper">
        <income-app .config="${this.config}"></income-app>

        <div class="nav-actions">
          <button type="button" class="btn btn-secondary" @click=${this._handleBack}>
            &larr; Wstecz do Startu
          </button>
          <button type="button" class="btn btn-primary" @click=${this._handleNext}>
            Przejdź do Podsumowania &rarr;
          </button>
        </div>
      </div>
    `;
  }
}
