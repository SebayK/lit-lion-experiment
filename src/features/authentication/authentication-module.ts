export type AuthenticationChannel = 'email' | 'phone';

export type AuthenticationStatus = 'idle' | 'sending' | 'awaiting-code' | 'send-error' | 'verifying' | 'invalid-code' | 'success';

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
}

export interface ConfirmCode {
  applicationId: string;
  challengeId: string;
  code: string;
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
  private requestVersion = 0;

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
    if (this.status === 'sending' && this.requestInFlight) {
      return this.requestInFlight;
    }

    if (this.challenge && this.contact === contact) {
      return Promise.resolve();
    }

    this.contact = contact;
    this.challenge = null;
    this.error = null;
    this.result = null;
    this.confirmationInFlight = undefined;
    this.status = 'sending';
    this.notify();
    const requestVersion = ++this.requestVersion;

    const request = this.adapter
      .requestCode({
        applicationId: this.applicationId,
        channel: this.channel,
        contact,
      })
      .then(challenge => {
        if (requestVersion !== this.requestVersion) return;
        this.challenge = challenge;
        this.status = 'awaiting-code';
        this.error = null;
        this.requestInFlight = undefined;
        this.notify();
      })
      .catch(error => {
        if (requestVersion !== this.requestVersion) return;
        this.status = 'send-error';
        this.error = error instanceof Error ? error : new Error('Nie udało się wysłać kodu.');
        this.requestInFlight = undefined;
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
    return this.challenge !== null && ['awaiting-code', 'invalid-code'].includes(this.status);
  }

  confirm(code: string): Promise<void> {
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
        this.error = error instanceof Error ? error : new Error('Nie udało się potwierdzić kodu.');
        this.status = 'invalid-code';
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
    if (!this.challenge || this.status !== 'awaiting-code') {
      return false;
    }

    return this.now() >= Date.parse(this.challenge.resendAvailableAt);
  }

  clear(): void {
    this.requestVersion++;
    this.status = 'idle';
    this.contact = null;
    this.challenge = null;
    this.error = null;
    this.result = null;
    this.confirmationInFlight = undefined;
    this.requestInFlight = undefined;
    this.notify();
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
