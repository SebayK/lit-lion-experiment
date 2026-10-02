import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { AuthenticationModule, maskContact } from './authentication-module.js';

@customElement('authentication-code-verification')
export class AuthenticationCodeVerification extends LitElement {
  @property({ attribute: false })
  module?: AuthenticationModule;

  @state()
  private code = '';

  private unsubscribe?: () => void;
  private renderedChallengeId?: string;

  static styles = css`
    :host {
      display: block;
      margin-top: 1.5rem;
    }

    .challenge {
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 1rem;
      background: #eff6ff;
      color: #1e40af;
    }

    .form-group {
      margin-top: 1rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    input {
      width: 100%;
      box-sizing: border-box;
      padding: 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 1.25rem;
      letter-spacing: 0.3em;
    }

    button {
      margin-top: 1rem;
      padding: 0.75rem 1.5rem;
      border: 0;
      border-radius: 8px;
      background: #2563eb;
      color: white;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }

    button:disabled {
      background: #cbd5e1;
      cursor: not-allowed;
    }

    [role='status'] {
      color: #334155;
    }

    [role='alert'] {
      color: #991b1b;
    }
  `;

  willUpdate(changedProperties: Map<PropertyKey, unknown>): void {
    if (changedProperties.has('module')) {
      this.unsubscribe?.();
      this.unsubscribe = this.module?.subscribe(() => this.requestUpdate());
      this.code = '';
      this.renderedChallengeId = undefined;
    }
  }

  updated(): void {
    const challengeId = this.module?.challenge?.challengeId;
    if (challengeId && challengeId !== this.renderedChallengeId) {
      this.renderedChallengeId = challengeId;
      this.code = '';
    }
  }

  disconnectedCallback(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    super.disconnectedCallback();
  }

  private handleCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.code = input.value.replace(/\D/g, '').slice(0, 6);
  }

  private handleConfirm(): void {
    this.dispatchEvent(
      new CustomEvent('authentication-confirm', {
        detail: { code: this.code },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    const module = this.module;
    if (!module || module.status === 'idle') {
      return html``;
    }

    if (module.status === 'sending') {
      return html`<div role="status" aria-live="polite">Wysyłanie kodu…</div>`;
    }

    if (module.status === 'send-error') {
      return html`<div role="alert">${module.error?.message ?? 'Nie udało się wysłać kodu.'}</div>`;
    }

    if (!module.contact) {
      return html``;
    }

    return html`
      <div class="challenge">
        <div>Kod został wysłany na <strong>${maskContact(module.channel, module.contact)}</strong>.</div>
        <div class="form-group">
          <label for="code">Kod weryfikacyjny</label>
          <input
            id="code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            .value=${this.code}
            @input=${this.handleCodeInput}
          />
          <button type="button" ?disabled=${this.code.length !== 6} @click=${this.handleConfirm}>
            Potwierdź
          </button>
        </div>
      </div>
    `;
  }
}
