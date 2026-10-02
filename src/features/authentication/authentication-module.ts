export type AuthenticationChannel = 'email' | 'phone';

export type AuthenticationStatus = 'idle' | 'sending' | 'awaiting-code' | 'send-error';

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
  private requestVersion = 0;

  status: AuthenticationStatus = 'idle';
  contact: string | null = null;
  challenge: CodeChallenge | null = null;
  error: Error | null = null;

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

    if (this.status === 'awaiting-code' && this.contact === contact) {
      return Promise.resolve();
    }

    this.contact = contact;
    this.challenge = null;
    this.error = null;
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
