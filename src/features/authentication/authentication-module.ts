export type AuthenticationChannel = 'email' | 'phone';

export type AuthenticationStatus = 'idle' | 'sending' | 'awaiting-code' | 'send-error' | 'verifying' | 'invalid-code' | 'confirm-error' | 'expired' | 'locked' | 'success';

export type AuthenticationErrorReason = 'invalid-code' | 'expired' | 'locked' | 'cooldown' | 'transport';

export class AuthenticationError extends Error {
  constructor(readonly reason: AuthenticationErrorReason, message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export interface CodeChallenge {
  challengeId: string;
  expiresAt: string;
  resendAvailableAt: string;
}

export interface RequestCode {
  applicationId: string;
  channel: AuthenticationChannel;
  contact: string;
}

export interface AuthenticationAdapter {
  requestCode(request: RequestCode): Promise<CodeChallenge>;
  confirmCode(request: ConfirmCode): Promise<VerificationResult>;
  invalidateChallenge(request: InvalidateChallenge): Promise<void>;
}

export interface ConfirmCode {
  applicationId: string;
  channel: AuthenticationChannel;
  challengeId: string;
  code: string;
}

export interface InvalidateChallenge {
  applicationId: string;
  channel: AuthenticationChannel;
  challengeId: string;
}

export interface VerificationResult {
  verificationToken: string;
}

export const CODE_PATTERN_SOURCE = '[1-9][0-9]{5}';
const codePattern = new RegExp(`^${CODE_PATTERN_SOURCE}$`);

export function isValidCode(code: string): boolean {
  return code.length === 6 && codePattern.test(code);
}

export interface AuthenticationModuleOptions {
  applicationId: string;
  channel: AuthenticationChannel;
  adapter: AuthenticationAdapter;
  now?: () => number;
}

export type AuthenticationSubscriber = () => void;

/**
 * DOM-independent state for one email or phone authentication challenge.
 *
 * The module deliberately knows nothing about routing or the process shell. A
 * parent owns its lifetime and can pass the same instance to any UI component
 * that needs to display the challenge.
 */
export class AuthenticationModule {
  readonly applicationId: string;
  readonly channel: AuthenticationChannel;
  readonly adapter: AuthenticationAdapter;

  private readonly now: () => number;
  private readonly subscribers = new Set<AuthenticationSubscriber>();
  private requestInFlight?: Promise<void>;
  private confirmationInFlight?: Promise<void>;
  private challengeInvalidationInFlight?: Promise<void>;
  private requestVersion = 0;
  private lastNow?: number;
  private canConfirmAfterSendError = false;

  status: AuthenticationStatus = 'idle';
  contact: string | null = null;
  challenge: CodeChallenge | null = null;
  error: Error | null = null;
  result: VerificationResult | null = null;

  constructor(options: AuthenticationModuleOptions) {
    this.applicationId = options.applicationId;
    this.channel = options.channel;
    this.adapter = options.adapter;
    this.now = options.now ?? Date.now;
  }

  subscribe(subscriber: AuthenticationSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  /** Starts a challenge for an already validated and normalized contact. */
  start(contact: string): Promise<void> {
    if (this.contact && this.contact !== contact) this.clear();
    if (this.status === 'sending' && this.requestInFlight) {
      return this.requestInFlight;
    }

    if (this.challenge && this.contact === contact) {
      return Promise.resolve();
    }

    this.contact = contact;
    this.error = null;
    this.result = null;
    this.confirmationInFlight = undefined;
    this.status = 'sending';
    this.notify();
    const pendingInvalidation = this.challengeInvalidationInFlight;
    if (pendingInvalidation) {
      const requestVersion = this.requestVersion;
      const request = pendingInvalidation.then(() => {
        if (requestVersion !== this.requestVersion) return;
        return this.requestChallenge(contact);
      });
      this.requestInFlight = request;
      return request;
    }
    return this.requestChallenge(contact);
  }

  private requestChallenge(contact: string): Promise<void> {
    const requestVersion = ++this.requestVersion;

    const request = this.adapter
      .requestCode({
        applicationId: this.applicationId,
        channel: this.channel,
        contact,
      })
      .then(async challenge => {
        if (requestVersion !== this.requestVersion) {
          await this.adapter.invalidateChallenge({
            applicationId: this.applicationId,
            channel: this.channel,
            challengeId: challenge.challengeId,
          }).catch(() => undefined);
          return;
        }
        this.challenge = challenge;
        this.status = 'awaiting-code';
        this.canConfirmAfterSendError = false;
        this.error = null;
        this.requestInFlight = undefined;
        this.notify();
      })
      .catch(error => {
        if (requestVersion !== this.requestVersion) return;
        this.error = error instanceof Error ? error : new AuthenticationError('transport', 'Nie udało się wysłać kodu.');
        this.requestInFlight = undefined;
        this.status = 'send-error';
        this.notify();
        throw this.error;
      });

    this.requestInFlight = request;
    return request;
  }

  get isSending(): boolean {
    return this.status === 'sending';
  }

  get canConfirm(): boolean {
    this.refresh();
    return this.challenge !== null && (
      ['awaiting-code', 'invalid-code', 'confirm-error'].includes(this.status) ||
      (this.status === 'send-error' && this.canConfirmAfterSendError)
    );
  }

  confirm(code: string): Promise<void> {
    this.refresh();
    if (this.status === 'verifying' && this.confirmationInFlight) return this.confirmationInFlight;
    if (!this.canConfirm) return Promise.resolve();
    if (!isValidCode(code)) {
      this.error = new Error('Kod musi zawierać sześć cyfr i nie może zaczynać się od zera.');
      this.status = 'invalid-code';
      this.notify();
      return Promise.resolve();
    }
    this.error = null;
    this.status = 'verifying';
    const requestVersion = this.requestVersion;
    const challengeId = this.challenge!.challengeId;
    this.notify();
    const confirmation = Promise.resolve().then(() => this.adapter.confirmCode({
        applicationId: this.applicationId,
        channel: this.channel,
        challengeId,
        code,
      }))
      .then(result => {
        if (requestVersion !== this.requestVersion) return;
        this.result = result;
        this.status = 'success';
      })
      .catch(error => {
        if (requestVersion !== this.requestVersion) return;
        const authError = error instanceof AuthenticationError ? error : new AuthenticationError('transport', error instanceof Error ? error.message : 'Nie udało się potwierdzić kodu.');
        this.error = authError;
        this.status = authError.reason === 'expired' ? 'expired'
          : authError.reason === 'locked' ? 'locked'
            : authError.reason === 'invalid-code' ? 'invalid-code' : 'confirm-error';
      })
      .then(() => {
        if (requestVersion !== this.requestVersion) return;
        this.confirmationInFlight = undefined;
        this.notify();
      });
    this.confirmationInFlight = confirmation;
    return confirmation;
  }

  get canResend(): boolean {
    this.refresh();
    if (!this.challenge || !['awaiting-code', 'invalid-code', 'confirm-error', 'expired', 'locked', 'send-error'].includes(this.status)) {
      return false;
    }

    if (this.status === 'send-error' &&
        (!(this.error instanceof AuthenticationError) || this.error.reason === 'transport')) return true;
    return this.now() >= Date.parse(this.challenge.resendAvailableAt);
  }

  get resendSecondsRemaining(): number {
    if (!this.challenge) return 0;
    return Math.max(0, Math.ceil((Date.parse(this.challenge.resendAvailableAt) - this.now()) / 1000));
  }

  get expiresInSeconds(): number {
    if (!this.challenge) return 0;
    return Math.max(0, Math.ceil((Date.parse(this.challenge.expiresAt) - this.now()) / 1000));
  }

  /** Refreshes time-derived challenge state; UI timers call this to update countdowns. */
  refresh(): void {
    if (!this.challenge || !['awaiting-code', 'invalid-code', 'confirm-error', 'send-error'].includes(this.status)) return;
    const now = this.now();
    if (now === this.lastNow) return;
    this.lastNow = now;
    this.notify();
  }

  resend(): Promise<void> {
    this.refresh();
    if (!this.canResend || !this.contact) return Promise.resolve();
    this.canConfirmAfterSendError = ['awaiting-code', 'invalid-code', 'confirm-error'].includes(this.status);
    this.error = null;
    this.result = null;
    this.status = 'sending';
    this.notify();
    return this.requestChallenge(this.contact);
  }

  clear(): void {
    const challengeToInvalidate = this.challenge && this.status !== 'success' ? this.challenge.challengeId : null;
    const requestToInvalidate = this.requestInFlight;
    this.requestVersion++;
    this.status = 'idle';
    this.contact = null;
    this.challenge = null;
    this.error = null;
    this.result = null;
    this.confirmationInFlight = undefined;
    this.requestInFlight = undefined;
    this.lastNow = undefined;
    this.canConfirmAfterSendError = false;
    this.notify();
    const pending: Promise<unknown>[] = [];
    if (challengeToInvalidate) {
      pending.push(Promise.resolve().then(() => this.adapter.invalidateChallenge({
        applicationId: this.applicationId,
        channel: this.channel,
        challengeId: challengeToInvalidate,
      })).catch(() => undefined));
    }
    if (requestToInvalidate) pending.push(requestToInvalidate.catch(() => undefined));
    const invalidation = Promise.all(pending).then(() => undefined);
    this.challengeInvalidationInFlight = invalidation;
    void invalidation.then(() => {
      if (this.challengeInvalidationInFlight === invalidation) this.challengeInvalidationInFlight = undefined;
    });
  }

  private notify(): void {
    for (const subscriber of this.subscribers) {
      subscriber();
    }
  }
}

export function maskContact(channel: AuthenticationChannel, contact: string): string {
  if (channel === 'email') {
    const [localPart, domain] = contact.split('@');
    if (!localPart || !domain) return '***';
    const visibleLocalPart = localPart.length <= 2 ? localPart[0] : localPart.slice(0, 2);
    return `${visibleLocalPart}${'*'.repeat(Math.max(1, localPart.length - visibleLocalPart.length))}@${domain}`;
  }

  const digits = contact.replace(/\D/g, '');
  return digits.length > 3 ? `${'*'.repeat(digits.length - 3)}${digits.slice(-3)}` : '***';
}
