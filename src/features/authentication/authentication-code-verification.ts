import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { AuthenticationModule, CODE_PATTERN_SOURCE, isValidCode, maskContact } from './authentication-module.js';

@customElement('authentication-code-verification')
export class AuthenticationCodeVerification extends LitElement {
  @property({ attribute: false })
  module?: AuthenticationModule;

  @state()
  private code = '';

  private unsubscribe?: () => void;
  private renderedChallengeId?: string;
  private countdownTimer?: ReturnType<typeof setInterval>;

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
    const challengeId = this.module?.challenge?.challengeId;
    if (challengeId !== this.renderedChallengeId) {
      this.renderedChallengeId = challengeId;
      this.code = '';
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.unsubscribe?.();
    this.unsubscribe = this.module?.subscribe(() => this.requestUpdate());
    this.code = '';
    this.countdownTimer = setInterval(() => {
      this.module?.refresh();
      this.requestUpdate();
    }, 1000);
    this.requestUpdate();
  }

  disconnectedCallback(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdownTimer = undefined;
    super.disconnectedCallback();
  }

  private handleCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.code = input.value;
  }

  private async handleConfirm(event: Event): Promise<void> {
    event.preventDefault();
    const module = this.module;
    if (!module?.canConfirm || !isValidCode(this.code)) return;
    const challengeId = module.challenge?.challengeId;
    await module.confirm(this.code);
    if (!this.isConnected || module !== this.module || module.challenge?.challengeId !== challengeId ||
        module.status !== 'success' || !module.result) return;
    this.dispatchEvent(
      new CustomEvent('authentication-success', {
        detail: module.result,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private async handleResend(): Promise<void> {
    const module = this.module;
    if (!module?.canResend) return;
    try {
      await module.resend();
    } catch {
      // The module exposes the transport error as visible state.
    }
  }

  render() {
    const module = this.module;
    if (!module || module.status === 'idle') {
      return html``;
    }

    if (module.status === 'sending') {
      return html`<div role="status" aria-live="polite">Wysyłanie kodu…</div>`;
    }

    if (module.status === 'send-error' && !module.challenge) {
      return html`<div role="alert">${module.error?.message ?? 'Nie udało się wysłać kodu.'}</div>`;
    }

    if (module.status === 'success') {
      return html`<div role="status">Kod został potwierdzony.</div>`;
    }

    if (!module.contact) {
      return html``;
    }

    return html`
      <div class="challenge">
        <div>Kod został wysłany na <strong>${maskContact(module.channel, module.contact)}</strong>.</div>
        ${module.status === 'expired' ? html`<p role="alert">Kod wygasł. Rozpocznij nowe wyzwanie.</p>` : ''}
        ${module.status === 'locked' ? html`<p role="alert">Limit prób został wyczerpany. Rozpocznij nowe wyzwanie.</p>` : ''}
        ${module.status === 'send-error' ? html`<p role="alert">${module.error?.message ?? 'Nie udało się wysłać nowego kodu.'}</p>` : ''}
        ${module.challenge && module.status !== 'expired' && module.status !== 'locked'
          ? html`<p role="status">${module.expiresInSeconds === 0
            ? 'Czas ważności minął. Potwierdź kod, aby sprawdzić jego status.'
            : `Kod wygaśnie za ${module.expiresInSeconds} s.`}</p>` : ''}
        <form class="form-group" @submit=${this.handleConfirm}>
          <label for="code">Kod weryfikacyjny</label>
          <input
            id="code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            pattern=${CODE_PATTERN_SOURCE}
            required
            aria-describedby="code-help code-error"
            aria-invalid=${module.status === 'invalid-code' ? 'true' : 'false'}
            ?disabled=${module.status === 'verifying'}
            .value=${this.code}
            @input=${this.handleCodeInput}
          />
          <div id="code-help">Wpisz sześć cyfr. Pierwsza cyfra nie może być zerem.</div>
          <div id="code-error" role="alert">${['invalid-code', 'confirm-error'].includes(module.status) ? module.error?.message ?? '' : ''}</div>
          ${module.status === 'verifying' ? html`<div role="status">Weryfikacja kodu…</div>` : ''}
          <button type="submit" ?disabled=${!isValidCode(this.code) || !module.canConfirm}>
            ${module.status === 'verifying' ? 'Weryfikacja…' : 'Potwierdź'}
          </button>
        </form>
        ${['awaiting-code', 'invalid-code', 'confirm-error', 'send-error', 'expired', 'locked'].includes(module.status) ? html`
          <p role="status">${module.canResend ? 'Możesz wysłać nowy kod.' : `Ponowna wysyłka dostępna za ${module.resendSecondsRemaining} s.`}</p>
          <button type="button" ?disabled=${!module.canResend} @click=${this.handleResend}>
            ${module.status === 'expired' || module.status === 'locked' ? 'Rozpocznij nowe wyzwanie' : 'Wyślij kod ponownie'}
          </button>
        ` : ''}
      </div>
    `;
  }
}
