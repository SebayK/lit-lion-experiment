import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { ref, createRef } from 'lit/directives/ref.js';
import '../../../features/income/index.js';
import type { IncomeStepConfig, IncomeApp, IncomeSourceConfig } from '../../../features/income/index.js';
import { selectAvailableIncomeSourceIds } from '../../income/store/income-slice.js';
import { selectClientProfile } from '../../client-profile/store/client-profile-slice.js';
import { StoreController } from '../../../shared/store/StoreController.js';
import type { ProcessController } from '../controllers/process-controller.js';
import { processContext } from '../context.js';

export const ALL_INCOME_SOURCE_CONFIGS: Record<string, IncomeSourceConfig> = {
  umowa_o_prace: {
    sourceId: 'umowa_o_prace',
    label: 'Umowa o Pracę',
    fields: [
      {
        name: 'companyName',
        label: 'Nazwa pracodawcy',
        type: 'input',
        required: true,
        placeholder: 'Wpisz nazwę pracodawcy',
      },
      {
        name: 'nip',
        label: 'NIP pracodawcy',
        type: 'input',
        required: true,
        placeholder: 'Wpisz NIP (10 cyfr)',
      },
    ],
    validations: {
      amount: { min: 2000, required: true },
      nip: { required: true, minLength: 10, maxLength: 10 },
      companyName: { required: true },
    },
  },
  umowa_zlecenie: {
    sourceId: 'umowa_zlecenie',
    label: 'Umowa Zlecenie / Dzieło',
    fields: [
      {
        name: 'contractorName',
        label: 'Nazwa zleceniodawcy',
        type: 'input',
        required: true,
        placeholder: 'Wpisz nazwę zleceniodawcy',
      },
    ],
    validations: {
      amount: { min: 1000, required: true },
      contractorName: { required: true },
    },
  },
  dzialalnosc_gospodarcza: {
    sourceId: 'dzialalnosc_gospodarcza',
    label: 'Działalność Gospodarcza (JDG / B2B)',
    fields: [
      {
        name: 'businessName',
        label: 'Nazwa działalności',
        type: 'input',
        required: true,
        placeholder: 'Wpisz nazwę firmy',
      },
      {
        name: 'businessNip',
        label: 'NIP działalności',
        type: 'input',
        required: true,
        placeholder: 'Wpisz NIP (10 cyfr)',
      },
    ],
    validations: {
      amount: { min: 3000, required: true },
      businessNip: { required: true, minLength: 10, maxLength: 10 },
      businessName: { required: true },
    },
  },
  emerytura: {
    sourceId: 'emerytura',
    label: 'Emerytura / Renta',
    fields: [
      {
        name: 'benefitNumber',
        label: 'Numer świadczenia ZUS',
        type: 'input',
        required: true,
        placeholder: 'np. 123456789/ZUS',
      },
    ],
    validations: {
      amount: { min: 1000, required: true },
      benefitNumber: { required: true },
    },
  },
  '800+': {
    sourceId: '800+',
    label: 'Świadczenie 800+',
    fields: [
      {
        name: 'childrenCount',
        label: 'Liczba dzieci objętych świadczeniem',
        type: 'amount',
        required: true,
        placeholder: 'Liczba dzieci (minimum 1)',
      },
    ],
    validations: {
      amount: { min: 800, max: 8000, required: true },
      childrenCount: { min: 1, required: true },
    },
  },
};

@customElement('income-step-page')
export class IncomeStepPage extends LitElement {
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

    .wrapper {
      max-width: 900px;
      margin: 0 auto;
    }

    .profile-info-banner {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 12px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      font-size: 0.9rem;
      color: #1e40af;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.35rem;
    }

    .tag {
      background: #dbeafe;
      color: #1e40af;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.8rem;
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

  private _handleBack() {
    this.dispatchEvent(
      new CustomEvent("request-navigate", {
        detail: "/process/client-profile",
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleNext() {
    const incomeApp = this.#incomeAppRef.value;
    if (incomeApp && !incomeApp.validateStep()) {
      console.warn('⚠️ [IncomeStepPage] Step validation failed — incomplete income dialog opened.');
      return;
    }

    this.processCtrl?.completeIncome();

    this.dispatchEvent(
      new CustomEvent("request-navigate", {
        detail: "/process/email-verification",
        bubbles: true,
        composed: true,
      })
    );
  }

  #incomeAppRef = createRef<IncomeApp>();

  render() {
    const profile = selectClientProfile(this.storeCtrl.state);
    const availableSourceIds = selectAvailableIncomeSourceIds(this.storeCtrl.state);

    const availableSources = availableSourceIds
      .map((id) => ALL_INCOME_SOURCE_CONFIGS[id])
      .filter((cfg): cfg is IncomeSourceConfig => Boolean(cfg));

    const config: IncomeStepConfig = {
      availableSources,
    };

    return html`
      <div class="wrapper">
        <div class="profile-info-banner">
          <div>
            <strong>🔗 Aktywne filtry ze Slice'a Profilu Klienta:</strong>
            <div class="tags">
              <span class="tag">Stan: ${profile.maritalStatus}</span>
              <span class="tag">Osoby na utrzymaniu: ${profile.dependentsCount}</span>
              <span class="tag">Działalność: ${profile.hasBusinessActivity ? 'Tak (B2B)' : 'Nie'}</span>
            </div>
          </div>
          <div style="text-align: right; font-size: 0.85rem;">
            Dostępnych źródeł: <strong>${availableSources.length}</strong>
          </div>
        </div>

        <income-app ${ref(this.#incomeAppRef)} .config="${config}"></income-app>

        <div class="nav-actions">
          <button type="button" class="btn btn-secondary" @click=${this._handleBack}>
            &larr; Wstecz do Danych Klienta
          </button>
          <button type="button" class="btn btn-primary" @click=${this._handleNext}>
            Przejdź do Weryfikacji Email &rarr;
          </button>
        </div>
      </div>
    `;
  }
}

