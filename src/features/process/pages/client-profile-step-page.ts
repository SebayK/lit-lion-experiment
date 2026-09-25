import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { StoreController } from '../../../shared/store/StoreController.js';
import { store } from '../../../shared/store/index.js';
import {
  setBusinessActivity,
  setDependentsCount,
  setMaritalStatus,
  selectClientProfile,
  type MaritalStatus,
} from '../../client-profile/store/client-profile-slice.js';
import type { ProcessController } from '../controllers/process-controller.js';
import { processContext } from '../context.js';

@customElement('client-profile-step-page')
export class ClientProfileStepPage extends LitElement {
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

    .profile-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 2.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      max-width: 650px;
      margin: 0 auto;
    }

    h2 {
      margin-top: 0;
      color: #0f172a;
      font-size: 1.75rem;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .subtitle {
      color: #64748b;
      margin-top: -0.5rem;
      margin-bottom: 1.5rem;
      font-size: 0.95rem;
    }

    .form-group {
      margin-bottom: 1.75rem;
    }

    label {
      display: block;
      font-weight: 600;
      color: #334155;
      margin-bottom: 0.5rem;
    }

    select, input[type="number"] {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.2s;
      box-sizing: border-box;
      background: #fff;
    }

    select:focus, input[type="number"]:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .switch-group {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .switch-group:hover {
      border-color: #cbd5e1;
      background: #f1f5f9;
    }

    .switch-label {
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .switch-subtext {
      font-size: 0.85rem;
      color: #64748b;
      margin-top: 0.25rem;
    }

    .switch-input {
      width: 2.75rem;
      height: 1.5rem;
      cursor: pointer;
      accent-color: #2563eb;
      transform: scale(1.3);
    }

    .hint-box {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 0.875rem 1rem;
      font-size: 0.875rem;
      color: #1e40af;
      margin-top: 1.5rem;
    }

    .hint-icon {
      font-size: 1.1rem;
      line-height: 1;
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
      cursor: pointer;
      border: none;
      font-size: 1rem;
      transition: all 0.2s ease;
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

  private _onMaritalStatusChange(e: Event) {
    const value = (e.target as HTMLSelectElement).value as MaritalStatus;
    store.dispatch(setMaritalStatus(value));
  }

  private _onDependentsChange(e: Event) {
    const value = parseInt((e.target as HTMLInputElement).value, 10) || 0;
    store.dispatch(setDependentsCount(Math.max(0, value)));
  }

  private _onBusinessToggle(e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    store.dispatch(setBusinessActivity(checked));
  }

  private _handleBack() {
    this.dispatchEvent(
      new CustomEvent('request-navigate', {
        detail: '/process/calculation',
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleNext() {
    this.processCtrl?.completeClientProfile();

    this.dispatchEvent(
      new CustomEvent('request-navigate', {
        detail: '/process/income',
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    const profile = selectClientProfile(this.storeCtrl.state);

    return html`
      <div class="profile-card">
        <h2>👤 Dane Klienta</h2>
        <p class="subtitle">Wprowadź swoje dane, abyśmy mogli dopasować dostępne źródła dochodu.</p>

        <div class="form-group">
          <label for="maritalStatus">Stan cywilny</label>
          <select
            id="maritalStatus"
            .value=${profile.maritalStatus}
            @change=${this._onMaritalStatusChange}
          >
            <option value="single">Kawaler / Panna</option>
            <option value="married">Żonaty / Mężatka</option>
            <option value="divorced">Rozwiedziony / Rozwiedziona</option>
            <option value="widowed">Wdowiec / Wdowa</option>
          </select>
        </div>

        <div class="form-group">
          <label for="dependents">Liczba osób na utrzymaniu (w tym dzieci)</label>
          <input
            id="dependents"
            type="number"
            min="0"
            max="15"
            .value=${profile.dependentsCount.toString()}
            @input=${this._onDependentsChange}
            placeholder="np. 2"
          />
        </div>

        <div class="form-group">
          <label class="switch-group" for="businessToggle">
            <div>
              <div class="switch-label">Działalność gospodarcza (B2B / JDG)</div>
              <div class="switch-subtext">Zaznacz, jeśli prowadzisz własną działalność</div>
            </div>
            <input
              id="businessToggle"
              class="switch-input"
              type="checkbox"
              .checked=${profile.hasBusinessActivity}
              @change=${this._onBusinessToggle}
            />
          </label>
        </div>

        <div class="hint-box">
          <span class="hint-icon">💡</span>
          <div>
            <strong>Wpływ na kolejny krok (Dochody):</strong>
            ${profile.hasBusinessActivity
              ? html`<div>✅ Odblokowano źródło <em>Działalność gospodarcza</em>.</div>`
              : html`<div>ℹ️ Działalność jest wyłączona (brak źródła B2B).</div>`}
            ${profile.dependentsCount > 0
              ? html`<div>✅ Odblokowano źródło <em>Świadczenie 800+</em> (liczba dzieci: ${profile.dependentsCount}).</div>`
              : html`<div>ℹ️ Brak osób na utrzymaniu (świadczenie 800+ jest ukryte).</div>`}
          </div>
        </div>

        <div class="actions">
          <button type="button" class="btn btn-secondary" @click=${this._handleBack}>
            &larr; Wstecz do Kalkulacji
          </button>
          <button type="button" class="btn btn-primary" @click=${this._handleNext}>
            Dalej do Dochodów &rarr;
          </button>
        </div>
      </div>
    `;
  }
}
