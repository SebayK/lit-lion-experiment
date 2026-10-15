import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import type { ProcessController } from '../controllers/process-controller.js';
import { processContext } from '../context.js';
import {
  AuthenticationModule,
  type AuthenticationAdapter,
  type VerificationResult,
} from '../../authentication/authentication-module.js';
import { HttpAuthenticationAdapter } from '../../authentication/authentication-adapter.js';
import '../../authentication/authentication-code-verification.js';

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\s/g, '');
  return digits.startsWith('+48') ? digits : `+48${digits}`;
}

export function isValidPhone(phone: string): boolean {
  return /^(\+48)?[0-9]{9}$/.test(phone.replace(/\s/g, ''));
}

@customElement('phone-verification-step-page')
export class PhoneVerificationStepPage extends LitElement {
  @consume({ context: processContext, subscribe: true })
  @state()
  private processCtrl?: ProcessController;

  @state()
  private phone = '';

  @state()
  private error = '';

  @property({ attribute: false })
  authenticationAdapter: AuthenticationAdapter = new HttpAuthenticationAdapter();

  @property({ attribute: false })
  authenticationModule?: AuthenticationModule;

  @state()
  private ownedAuthenticationModule?: AuthenticationModule;

  private subscribedProcess?: ProcessController;
  private subscribedModule?: AuthenticationModule;
  private unsubscribeProcess?: () => void;
  private unsubscribeModule?: () => void;
  private processApplicationId?: string;
  private resetCleanup?: {
    controller: ProcessController;
    module: AuthenticationModule;
    applicationId: string;
    unregister: () => void;
  };

  static styles = css`
    :host { display: block; animation: fadeIn 0.3s ease-in-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .verification-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 2.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,.05); max-width: 600px; margin: 0 auto; }
    h2 { margin-top: 0; color: #0f172a; font-size: 1.75rem; border-bottom: 2px solid #f1f5f9; padding-bottom: .75rem; }
    .info-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem; color: #1e40af; }
    .form-group { margin-bottom: 1.5rem; }
    label { display: block; font-weight: 600; color: #334155; margin-bottom: .5rem; }
    input[type="tel"] { box-sizing: border-box; width: 100%; padding: .75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; }
    input[type="tel"]:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.1); }
    input[type="tel"].error { border-color: #dc2626; }
    .error-message { color: #dc2626; font-size: .875rem; margin-top: .5rem; }
    .error-state { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 1.5rem; text-align: center; color: #991b1b; }
    .actions { display: flex; justify-content: space-between; gap: 1rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; }
    .btn { display: inline-flex; align-items: center; gap: .5rem; padding: .75rem 1.5rem; border-radius: 8px; font-weight: 600; text-decoration: none; cursor: pointer; border: none; font-size: 1rem; }
    .btn-secondary { background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; }
    .btn-primary { background: #2563eb; color: white; }
    .btn-primary:disabled { background: #cbd5e1; cursor: not-allowed; }
  `;

  private get activeAuthenticationModule(): AuthenticationModule | undefined {
    return this.authenticationModule ?? this.ownedAuthenticationModule;
  }

  protected willUpdate(): void {
    if (!this.isConnected) return;
    if (this.subscribedProcess !== this.processCtrl) {
      this.unsubscribeProcess?.();
      this.subscribedProcess = this.processCtrl;
      this.unsubscribeProcess = this.processCtrl?.subscribe(this);
    }
    if (this.processCtrl && this.processApplicationId !== this.processCtrl.applicationId) {
      if (this.processApplicationId) {
        this.phone = '';
        this.error = '';
      }
      this.processApplicationId = this.processCtrl.applicationId;
    }
    if (this.processCtrl && !this.authenticationModule &&
        this.ownedAuthenticationModule?.applicationId !== this.processCtrl.applicationId) {
      this.ownedAuthenticationModule = new AuthenticationModule({
        applicationId: this.processCtrl.applicationId,
        channel: 'phone',
        adapter: this.authenticationAdapter,
      });
    }
    const controller = this.processCtrl;
    const module = this.activeAuthenticationModule;
    if (this.resetCleanup?.controller !== controller || this.resetCleanup?.module !== module ||
        this.resetCleanup?.applicationId !== controller?.applicationId) {
      this.resetCleanup?.unregister();
      this.resetCleanup = undefined;
      if (controller && module) {
        this.resetCleanup = {
          controller,
          module,
          applicationId: controller.applicationId,
          unregister: controller.registerResetCleanup(() => module.clear()),
        };
      }
    }
    if (this.subscribedModule !== module) {
      this.unsubscribeModule?.();
      this.subscribedModule = module;
      this.unsubscribeModule = module?.subscribe(() => this.requestUpdate());
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.requestUpdate();
  }

  disconnectedCallback(): void {
    this.unsubscribeProcess?.();
    this.unsubscribeModule?.();
    this.subscribedProcess = undefined;
    this.subscribedModule = undefined;
    this.ownedAuthenticationModule?.clear();
    if (this.resetCleanup?.module === this.ownedAuthenticationModule) {
      this.resetCleanup?.unregister();
      this.resetCleanup = undefined;
    }
    super.disconnectedCallback();
  }

  private handlePhoneChange(event: Event): void {
    const nextPhone = (event.target as HTMLInputElement).value;
    const module = this.activeAuthenticationModule;
    if (module?.contact && normalizePhone(nextPhone) !== module.contact) module.clear();
    this.phone = nextPhone;
    this.error = '';
  }

  private handleStart(): void {
    if (!this.phone) {
      this.error = 'Numer telefonu jest wymagany';
      return;
    }
    if (!isValidPhone(this.phone)) {
      this.error = 'Podaj prawidłowy numer telefonu (9 cyfr lub +48 i 9 cyfr)';
      return;
    }
    const normalizedPhone = normalizePhone(this.phone);
    this.phone = normalizedPhone;
    this.error = '';
    void this.activeAuthenticationModule?.start(normalizedPhone).catch(() => undefined);
  }

  private handleBack(): void {
    this.dispatchEvent(new CustomEvent('request-navigate', {
      detail: '/process/email-verification', bubbles: true, composed: true,
    }));
  }

  private handleAuthenticationSuccess(event: CustomEvent<VerificationResult>): void {
    event.stopPropagation();
    const module = this.activeAuthenticationModule;
    if (!module?.contact || module.status !== 'success' || !module.result ||
        module.applicationId !== this.processCtrl?.applicationId || module.channel !== 'phone') return;
    this.dispatchEvent(new CustomEvent('phone-verification-success', {
      detail: { applicationId: module.applicationId, phone: module.contact, verificationToken: module.result.verificationToken },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    if (!this.processCtrl) {
      return html`<div class="error-state"><p>Nie można załadować stanu procesu.</p><a href="/process">Powrót do początku</a></div>`;
    }
    const authenticationModule = this.activeAuthenticationModule;
    return html`
      <div class="verification-card">
        <h2>Weryfikacja numeru telefonu</h2>
        <div class="info-box">📱 Podaj swój numer telefonu, abyśmy mogli się z Tobą skontaktować.</div>
        <div class="form-group">
          <label for="phone">Numer telefonu</label>
          <input id="phone" type="tel" class=${this.error ? 'error' : ''} placeholder="+48 123 456 789"
            .value=${this.phone} @input=${this.handlePhoneChange}
            @keydown=${(event: KeyboardEvent) => event.key === 'Enter' && this.handleStart()} />
          ${this.error ? html`<div class="error-message" role="alert">${this.error}</div>` : ''}
        </div>
        <div class="actions">
          <button type="button" class="btn btn-secondary" @click=${this.handleBack}>&larr; Wstecz</button>
          <button type="button" class="btn btn-primary" @click=${this.handleStart}
            ?disabled=${!this.phone || authenticationModule?.isSending}>Dalej &rarr;</button>
        </div>
        <authentication-code-verification .module=${authenticationModule}
          @authentication-success=${this.handleAuthenticationSuccess}></authentication-code-verification>
      </div>
    `;
  }
}
