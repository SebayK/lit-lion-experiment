import { expect } from '@esm-bundle/chai';
import { AuthenticationError, AuthenticationModule, type CodeChallenge } from './authentication-module.js';
import './authentication-code-verification.js';
import { AuthenticationCodeVerification } from './authentication-code-verification.js';

const challenge: CodeChallenge = {
  challengeId: 'challenge-1',
  expiresAt: '2036-10-02T12:05:00.000Z',
  resendAvailableAt: '2036-10-02T12:01:00.000Z',
};

async function settle(element: AuthenticationCodeVerification): Promise<void> {
  await element.updateComplete;
  await new Promise(resolve => setTimeout(resolve, 0));
  await element.updateComplete;
}

describe('AuthenticationCodeVerification', () => {
  let element: AuthenticationCodeVerification;

  afterEach(() => element?.remove());

  it('emits only challenge B success when a cleared challenge A rejects after B succeeds', async () => {
    let rejectFirst!: (error: Error) => void;
    const module = new AuthenticationModule({
      applicationId: 'application-1', channel: 'email',
      adapter: {
        requestCode: async ({ contact }) => ({ ...challenge, challengeId: contact === 'first@example.com' ? 'challenge-a' : 'challenge-b' }),
        confirmCode: ({ challengeId }) => challengeId === 'challenge-a'
          ? new Promise((_resolve, reject) => { rejectFirst = reject; })
          : Promise.resolve({ verificationToken: 'token-b' }),
        invalidateChallenge: async () => {},
      },
    });
    element = document.createElement('authentication-code-verification') as AuthenticationCodeVerification;
    element.module = module;
    document.body.appendChild(element);
    const results: unknown[] = [];
    element.addEventListener('authentication-success', event => results.push((event as CustomEvent).detail));
    await module.start('first@example.com');
    await settle(element);
    let input = element.shadowRoot!.querySelector('input#code') as HTMLInputElement;
    input.value = '102030';
    input.dispatchEvent(new Event('input'));
    await settle(element);
    (element.shadowRoot!.querySelector('button') as HTMLButtonElement).click();
    await settle(element);
    expect(module.status).to.equal('verifying');

    module.clear();
    await module.start('second@example.com');
    await settle(element);
    input = element.shadowRoot!.querySelector('input#code') as HTMLInputElement;
    input.value = '102030';
    input.dispatchEvent(new Event('input'));
    await settle(element);
    (element.shadowRoot!.querySelector('button') as HTMLButtonElement).click();
    await settle(element);
    expect(results).to.deep.equal([{ verificationToken: 'token-b' }]);
    rejectFirst(new Error('Delayed challenge A failure'));
    await settle(element);
    expect(results).to.deep.equal([{ verificationToken: 'token-b' }]);
    expect(module.result).to.deep.equal({ verificationToken: 'token-b' });
  });

  it('keeps malformed and leading-zero input out of confirmation without normalizing it into a valid code', async () => {
    let confirmations = 0;
    const module = new AuthenticationModule({
      applicationId: 'application-1', channel: 'email',
      adapter: {
        requestCode: async () => challenge,
        confirmCode: async () => { confirmations++; return { verificationToken: 'token' }; },
        invalidateChallenge: async () => {},
      },
    });
    element = document.createElement('authentication-code-verification') as AuthenticationCodeVerification;
    element.module = module;
    document.body.appendChild(element);
    await module.start('jane@example.com');
    await settle(element);
    const input = element.shadowRoot!.querySelector('input#code') as HTMLInputElement;
    const form = element.shadowRoot!.querySelector('form')!;
    for (const code of ['012345', '12345', '1020309', '1a02030', ' 102030']) {
      input.value = code;
      input.dispatchEvent(new Event('input'));
      await settle(element);
      expect((element.shadowRoot!.querySelector('button') as HTMLButtonElement).disabled).to.be.true;
      form.dispatchEvent(new Event('submit', { cancelable: true }));
      await settle(element);
    }
    expect(confirmations).to.equal(0);
    input.value = '102030';
    input.dispatchEvent(new Event('input'));
    await settle(element);
    expect((element.shadowRoot!.querySelector('button') as HTMLButtonElement).disabled).to.be.false;
  });

  it('shows verification progress, blocks duplicate submits and publishes one success', async () => {
    let resolveConfirmation!: (result: { verificationToken: string }) => void;
    let confirmations = 0;
    const module = new AuthenticationModule({
      applicationId: 'application-1', channel: 'email',
      adapter: {
        requestCode: async () => challenge,
        confirmCode: () => {
          confirmations++;
          return new Promise(resolve => { resolveConfirmation = resolve; });
        },
        invalidateChallenge: async () => {},
      },
    });
    element = document.createElement('authentication-code-verification') as AuthenticationCodeVerification;
    element.module = module;
    document.body.appendChild(element);
    await module.start('jane@example.com');
    await settle(element);
    let successes = 0;
    element.addEventListener('authentication-success', () => successes++);
    const input = element.shadowRoot!.querySelector('input#code') as HTMLInputElement;
    input.value = '102030';
    input.dispatchEvent(new Event('input'));
    await settle(element);
    const form = element.shadowRoot!.querySelector('form')!;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await settle(element);
    expect(confirmations).to.equal(1);
    expect(successes).to.equal(0);
    expect(input.disabled).to.be.true;
    expect((element.shadowRoot!.querySelector('button') as HTMLButtonElement).disabled).to.be.true;
    expect(form.querySelector('[role="status"]')?.textContent).to.include('Weryfikacja');
    resolveConfirmation({ verificationToken: 'token' });
    await settle(element);
    expect(successes).to.equal(1);
  });

  it('resubscribes to visible challenge state after reconnecting the same component', async () => {
    const module = new AuthenticationModule({
      applicationId: 'application-1', channel: 'email',
      adapter: {
        requestCode: async () => challenge,
        confirmCode: async () => { throw new Error('Niepoprawny kod. Spróbuj ponownie.'); },
        invalidateChallenge: async () => {},
      },
    });
    element = document.createElement('authentication-code-verification') as AuthenticationCodeVerification;
    element.module = module;
    document.body.appendChild(element);
    await module.start('jane@example.com');
    await settle(element);
    element.remove();
    document.body.appendChild(element);
    await settle(element);
    await module.confirm('654321');
    await settle(element);
    expect(element.shadowRoot!.querySelector('[role="alert"]')?.textContent).to.include('Niepoprawny kod');
  });

  it('waits for explicit keyboard submission and emits an opaque success result', async () => {
    const module = new AuthenticationModule({
      applicationId: 'application-1', channel: 'email',
      adapter: {
        requestCode: async () => challenge,
        confirmCode: async () => ({ verificationToken: 'opaque-token' }),
        invalidateChallenge: async () => {},
      },
    });
    element = document.createElement('authentication-code-verification') as AuthenticationCodeVerification;
    element.module = module;
    document.body.appendChild(element);
    await module.start('jane@example.com');
    await settle(element);
    const results: unknown[] = [];
    element.addEventListener('authentication-success', event => results.push((event as CustomEvent).detail));
    const input = element.shadowRoot!.querySelector('input#code') as HTMLInputElement;
    input.value = '102030';
    input.dispatchEvent(new Event('input'));
    await settle(element);
    expect(module.status).to.equal('awaiting-code');
    expect(results).to.deep.equal([]);
    element.shadowRoot!.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await settle(element);
    expect(results).to.deep.equal([{ verificationToken: 'opaque-token' }]);
    expect(element.shadowRoot!.textContent).to.include('potwierdzony');
  });

  it('does not request a code when it is mounted and rendered', async () => {
    let requestCount = 0;
    const module = new AuthenticationModule({
      applicationId: 'application-1',
      channel: 'email',
      adapter: {
        confirmCode: async () => ({ verificationToken: 'token' }),
        requestCode: async () => {
          requestCount++;
          return challenge;
        },
        invalidateChallenge: async () => {},
      },
    });
    element = document.createElement('authentication-code-verification') as AuthenticationCodeVerification;
    element.module = module;
    document.body.appendChild(element);

    await settle(element);

    expect(requestCount).to.equal(0);
  });

  it('shows the masked email, code field, and explicit confirm button after sending', async () => {
    const module = new AuthenticationModule({
      applicationId: 'application-1',
      channel: 'email',
      adapter: {
        requestCode: async () => challenge,
        confirmCode: async () => ({ verificationToken: 'token' }),
        invalidateChallenge: async () => {},
      },
    });
    element = document.createElement('authentication-code-verification') as AuthenticationCodeVerification;
    element.module = module;
    document.body.appendChild(element);

    await module.start('jane@example.com');
    await settle(element);

    expect(element.shadowRoot?.textContent).to.include('ja**@example.com');
    expect(element.shadowRoot?.querySelector('input#code')).to.exist;
    expect(element.shadowRoot?.textContent).to.include('Potwierdź');
  });

  it('shows the resend cooldown and enables a new challenge when sixty seconds pass', async () => {
    let now = Date.parse('2036-10-02T12:00:00.000Z');
    let requests = 0;
    const module = new AuthenticationModule({
      applicationId: 'application-1',
      channel: 'email',
      now: () => now,
      adapter: {
        requestCode: async () => {
          requests++;
          return {
            challengeId: `challenge-${requests}`,
            expiresAt: new Date(now + 5 * 60_000).toISOString(),
            resendAvailableAt: new Date(now + 60_000).toISOString(),
          };
        },
        confirmCode: async () => {
          if (now >= Date.parse('2036-10-02T12:00:00.000Z') + 60_000 + 5 * 60_000) {
            throw new AuthenticationError('expired', 'Kod wygasł. Rozpocznij nowe wyzwanie.');
          }
          return { verificationToken: 'token' };
        },
        invalidateChallenge: async () => {},
      },
    });
    element = document.createElement('authentication-code-verification') as AuthenticationCodeVerification;
    element.module = module;
    document.body.appendChild(element);

    await module.start('jane@example.com');
    await settle(element);
    const resendButton = element.shadowRoot!.querySelector('button[type="button"]') as HTMLButtonElement;
    expect(resendButton.disabled).to.be.true;
    expect(element.shadowRoot!.textContent).to.include('60 s');

    now += 60_000;
    module.refresh();
    await settle(element);
    expect((element.shadowRoot!.querySelector('button[type="button"]') as HTMLButtonElement).disabled).to.be.false;
    (element.shadowRoot!.querySelector('button[type="button"]') as HTMLButtonElement).click();
    await settle(element);

    expect(requests).to.equal(2);
    expect(module.challenge?.challengeId).to.equal('challenge-2');
    expect(element.shadowRoot!.textContent).to.include('60 s');

    now += 5 * 60_000;
    module.refresh();
    await settle(element);
    expect(module.status).to.equal('awaiting-code');
    expect(element.shadowRoot!.textContent).to.include('Potwierdź kod, aby sprawdzić jego status.');
    const codeInput = element.shadowRoot!.querySelector('input#code') as HTMLInputElement;
    codeInput.value = '102030';
    codeInput.dispatchEvent(new Event('input'));
    await settle(element);
    element.shadowRoot!.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await settle(element);
    expect(module.status).to.equal('expired');
    expect(element.shadowRoot!.textContent).to.include('Kod wygasł');
    const recoveryButton = element.shadowRoot!.querySelector('button[type="button"]') as HTMLButtonElement;
    expect(recoveryButton.textContent).to.include('Rozpocznij nowe wyzwanie');
    expect(recoveryButton.disabled).to.be.false;
    recoveryButton.click();
    await settle(element);
    expect(requests).to.equal(3);
    expect(module.challenge?.challengeId).to.equal('challenge-3');
  });
});
