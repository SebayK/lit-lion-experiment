import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import type { ProcessController } from '../controllers/process-controller.js';
import { processContext } from '../context.js';
import {
  AuthenticationModule,
  type AuthenticationAdapter,
} from '../../authentication/authentication-module.js';
import { HttpAuthenticationAdapter } from '../../authentication/authentication-adapter.js';
import '../../authentication/authentication-code-verification.js';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

@customElement('email-verification-step-page')
export class EmailVerificationStepPage extends LitElement {
  @consume({ context: processContext, subscribe: true })
  @state()
  private processCtrl?: ProcessController;

  @state()
  private email: string = '';

  @state()
  private error: string = '';

  /** Optional injection seam for the page's parent and component tests. */
  @property({ attribute: false })
  authenticationAdapter: AuthenticationAdapter = new HttpAuthenticationAdapter();

  /** A parent may provide a longer-lived module instance. */
  @property({ attribute: false })
  authenticationModule?: AuthenticationModule;

  @state()
  private ownedAuthenticationModule?: AuthenticationModule;

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

    input[type="email"] {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    input[type="email"]:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    input[type="email"].error {
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

  private get activeAuthenticationModule(): AuthenticationModule | undefined {
    return this.authenticationModule ?? this.ownedAuthenticationModule;
  }

  protected updated(): void {
    if (
      this.processCtrl &&
      !this.authenticationModule &&
      this.ownedAuthenticationModule?.applicationId !== this.processCtrl.applicationId
    ) {
      this.ownedAuthenticationModule = new AuthenticationModule({
        applicationId: this.processCtrl.applicationId,
        channel: 'email',
        adapter: this.authenticationAdapter,
      });
    }
  }

  private _handleEmailChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    const nextEmail = input.value;
    const module = this.activeAuthenticationModule;
    if (module?.contact && normalizeEmail(nextEmail) !== module.contact) {
      module.clear();
    }
    this.email = nextEmail;
    this.error = '';
  }

  private _handleStart(): void {
    if (!this.email) {
      this.error = 'Adres email jest wymagany';
      return;
    }

    const normalizedEmail = normalizeEmail(this.email);
    if (!isValidEmail(normalizedEmail)) {
      this.error = 'Podaj prawidłowy adres email';
      return;
    }

    this.email = normalizedEmail;
    this.error = '';
    const module = this.activeAuthenticationModule;
    if (module) {
      void module.start(normalizedEmail).catch(() => undefined);
    }
  }

  private _handleBack(): void {
    this.dispatchEvent(
      new CustomEvent("request-navigate", {
        detail: "/process/income",
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
    const authenticationModule = this.activeAuthenticationModule;
    return html`
      <div class="verification-card">
        <h2>Weryfikacja adresu email</h2>
        
        <div class="info-box">
          💡 Podaj swój adres email, abyśmy mogli się z Tobą skontaktować.
        </div>

        <div class="form-group">
          <label for="email">Adres email</label>
          <input
            id="email"
            type="email"
            class="${this.error ? 'error' : ''}"
            placeholder="twoj@email.pl"
            .value=${this.email}
            @input=${this._handleEmailChange}
            @keypress=${(e: KeyboardEvent) => e.key === 'Enter' && this._handleStart()}
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
            @click=${this._handleStart}
            ?disabled=${!this.email || authenticationModule?.isSending}
          >
            Dalej &rarr;
          </button>
        </div>

        <authentication-code-verification .module=${authenticationModule}></authentication-code-verification>
      </div>
    `;
  }
}
