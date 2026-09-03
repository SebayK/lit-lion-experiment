import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import type { ProcessController } from '../controllers/process-controller.js';
import { processContext } from '../context.js';

@customElement('phone-verification-step-page')
export class PhoneVerificationStepPage extends LitElement {
  @consume({ context: processContext, subscribe: true })
  @state()
  private processCtrl?: ProcessController;

  @state()
  private phone: string = '';

  @state()
  private error: string = '';

  static styles = css`
    :host {
      display: block;
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .verification-card {
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

    .info-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
      color: #1e40af;
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

    input[type="tel"] {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    input[type="tel"]:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    input[type="tel"].error {
      border-color: #dc2626;
    }

    .error-message {
      color: #dc2626;
      font-size: 0.875rem;
      margin-top: 0.5rem;
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

    .btn-primary:disabled {
      background: #cbd5e1;
      cursor: not-allowed;
    }
  `;

  private _validatePhone(phone: string): boolean {
    // Simple Polish phone number validation (9 digits or +48 followed by 9 digits)
    const phoneRegex = /^(\+48)?[0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  private _handlePhoneChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.phone = input.value;
    this.error = '';
  }

  private _handleVerify(): void {
    if (!this.phone) {
      this.error = 'Numer telefonu jest wymagany';
      return;
    }

    if (!this._validatePhone(this.phone)) {
      this.error = 'Podaj prawidłowy numer telefonu (9 cyfr lub +48 i 9 cyfr)';
      return;
    }

    this.processCtrl?.completePhoneVerification(this.phone);

    this.dispatchEvent(
      new CustomEvent("request-navigate", {
        detail: "/dashboard",
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleBack(): void {
    this.dispatchEvent(
      new CustomEvent("request-navigate", {
        detail: "/email-verification",
        bubbles: true,
        composed: true,
      })
    );
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

    return html`
      <div class="verification-card">
        <h2>Weryfikacja numeru telefonu</h2>
        
        <div class="info-box">
          📱 Podaj swój numer telefonu, abyśmy mogli się z Tobą skontaktować.
        </div>

        <div class="form-group">
          <label for="phone">Numer telefonu</label>
          <input
            id="phone"
            type="tel"
            class="${this.error ? 'error' : ''}"
            placeholder="+48 123 456 789"
            .value=${this.phone}
            @input=${this._handlePhoneChange}
            @keypress=${(e: KeyboardEvent) => e.key === 'Enter' && this._handleVerify()}
          />
          ${this.error ? html`<div class="error-message">${this.error}</div>` : ''}
        </div>

        <div class="actions">
          <button type="button" class="btn btn-secondary" @click=${this._handleBack}>
            &larr; Wstecz
          </button>
          <button 
            type="button" 
            class="btn btn-primary" 
            @click=${this._handleVerify}
            ?disabled=${!this.phone}
          >
            Zweryfikuj telefon &rarr;
          </button>
        </div>
      </div>
    `;
  }
}
