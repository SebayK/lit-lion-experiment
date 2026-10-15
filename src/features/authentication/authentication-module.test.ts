import { expect } from '@esm-bundle/chai';
import {
  AuthenticationModule,
  AuthenticationError,
  type AuthenticationAdapter,
  type CodeChallenge,
} from './authentication-module.js';

const challenge: CodeChallenge = {
  challengeId: 'challenge-1',
  expiresAt: '2036-10-02T12:05:00.000Z',
  resendAvailableAt: '2036-10-02T12:01:00.000Z',
};

describe('AuthenticationModule', () => {
  it('preserves the active challenge on repeated starts and clears the successful result for a new contact', async () => {
    let requests = 0;
    const module = new AuthenticationModule({
      applicationId: 'application-1', channel: 'email',
      adapter: {
        requestCode: async () => { requests++; return challenge; },
        confirmCode: async ({ code }) => {
          if (code !== '102030') throw new Error('Wrong code');
          return { verificationToken: 'token' };
        },
        invalidateChallenge: async () => {},
      },
    });
    await module.start('jane@example.com');
    await module.confirm('654321');
    await module.start('jane@example.com');
    expect(requests).to.equal(1);
    await module.confirm('102030');
    await module.start('new@example.com');
    expect(module.result).to.be.null;
    expect(module.status).to.equal('awaiting-code');
    module.clear();
    expect(module.result).to.be.null;
  });
  it('prevents parallel confirmations and ignores their result after clearing the challenge', async () => {
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
    await module.start('jane@example.com');
    const first = module.confirm('102030');
    const second = module.confirm('102030');
    await Promise.resolve();
    expect(module.status).to.equal('verifying');
    expect(confirmations).to.equal(1);
    module.clear();
    resolveConfirmation({ verificationToken: 'stale-token' });
    await Promise.all([first, second]);
    expect(module.status).to.equal('idle');
    expect(module.result).to.be.null;
    expect(module.challenge).to.be.null;
  });
  it('keeps a wrong-code challenge active so the user can retry successfully', async () => {
    const module = new AuthenticationModule({
      applicationId: 'application-1', channel: 'email',
      adapter: {
        requestCode: async () => challenge,
        confirmCode: async ({ code }) => {
          if (code !== '102030') throw new AuthenticationError('invalid-code', 'Niepoprawny kod. Spróbuj ponownie.');
          return { verificationToken: 'token' };
        },
        invalidateChallenge: async () => {},
      },
    });
    await module.start('jane@example.com');
    await module.confirm('654321');
    expect(module.status).to.equal('invalid-code');
    expect(module.result).to.be.null;
    expect(module.challenge).to.deep.equal(challenge);
    await module.confirm('102030');
    expect(module.status).to.equal('success');
    expect(module.error).to.be.null;
  });
  it('rejects malformed codes without sending them to the adapter', async () => {
    let confirmations = 0;
    const module = new AuthenticationModule({
      applicationId: 'application-1', channel: 'email',
      adapter: {
        requestCode: async () => challenge,
        confirmCode: async () => { confirmations++; return { verificationToken: 'token' }; },
        invalidateChallenge: async () => {},
      },
    });
    await module.start('jane@example.com');
    for (const code of ['012345', '12345', '1234567', '12a456', ' 123456', '123456\n']) {
      await module.confirm(code);
      expect(module.result).to.be.null;
      expect(module.error?.message).to.include('sześć cyfr');
    }
    expect(confirmations).to.equal(0);
  });
  it('confirms a code with an internal zero and exposes its opaque verification result', async () => {
    const module = new AuthenticationModule({
      applicationId: 'application-1',
      channel: 'email',
      adapter: {
        requestCode: async () => challenge,
        confirmCode: async request => {
          expect(request).to.deep.equal({ applicationId: 'application-1', channel: 'email', challengeId: 'challenge-1', code: '102030' });
          return { verificationToken: 'opaque-token' };
        },
        invalidateChallenge: async () => {},
      },
    });
    await module.start('jane@example.com');

    await module.confirm('102030');

    expect(module.status).to.equal('success');
    expect(module.result).to.deep.equal({ verificationToken: 'opaque-token' });
  });

  it('expires an active challenge at five minutes and allows recovery after the resend cooldown', async () => {
    let now = Date.parse('2026-10-02T12:00:00.000Z');
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
          if (now >= Date.parse(module.challenge?.expiresAt ?? '')) {
            throw new AuthenticationError('expired', 'Kod wygasł.');
          }
          return { verificationToken: 'token' };
        },
        invalidateChallenge: async () => {},
      },
    });

    await module.start('jane@example.com');

    expect(module.status).to.equal('awaiting-code');
    expect(module.canResend).to.equal(false);
    now += 5 * 60_000;
    module.refresh();
    expect(module.status).to.equal('awaiting-code');
    expect(module.expiresInSeconds).to.equal(0);
    expect(module.canConfirm).to.equal(true);
    await module.confirm('123456');
    expect(module.status).to.equal('expired');
    expect(module.canResend).to.equal(true);

    await module.resend();

    expect(requests).to.equal(2);
    expect(module.status).to.equal('awaiting-code');
    expect(module.challenge?.challengeId).to.equal('challenge-2');
  });

  it('locks a challenge after five wrong attempts and permits a new challenge only after cooldown', async () => {
    let now = Date.parse('2026-10-02T12:00:00.000Z');
    let requests = 0;
    let confirmations = 0;
    const module = new AuthenticationModule({
      applicationId: 'application-1',
      channel: 'phone',
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
          confirmations++;
          throw confirmations === 5
            ? new AuthenticationError('locked', 'Wyzwanie zostało zablokowane.')
            : new AuthenticationError('invalid-code', 'Niepoprawny kod.');
        },
        invalidateChallenge: async () => {},
      },
    });

    await module.start('+48123456789');
    for (let attempt = 0; attempt < 5; attempt++) await module.confirm('654321');

    expect(confirmations).to.equal(5);
    expect(module.status).to.equal('locked');
    expect(module.canConfirm).to.equal(false);
    await module.confirm('123456');
    expect(confirmations).to.equal(5);

    now += 60_000;
    module.refresh();
    expect(module.canResend).to.equal(true);
    await module.resend();
    expect(requests).to.equal(2);
    expect(module.status).to.equal('awaiting-code');
  });

  it('lets a correct code succeed on the fifth allowed attempt', async () => {
    let attempts = 0;
    const module = new AuthenticationModule({
      applicationId: 'application-1',
      channel: 'email',
      adapter: {
        requestCode: async () => challenge,
        confirmCode: async () => {
          attempts++;
          if (attempts < 5) throw new AuthenticationError('invalid-code', 'Niepoprawny kod.');
          return { verificationToken: 'token' };
        },
        invalidateChallenge: async () => {},
      },
    });

    await module.start('jane@example.com');
    for (let attempt = 0; attempt < 5; attempt++) await module.confirm(attempt === 4 ? '123456' : '654321');

    expect(attempts).to.equal(5);
    expect(module.status).to.equal('success');
    expect(module.result?.verificationToken).to.equal('token');
  });

  it('allows an immediate resend after a transport failure without creating a cooldown', async () => {
    let requests = 0;
    const module = new AuthenticationModule({
      applicationId: 'application-1',
      channel: 'email',
      adapter: {
        requestCode: async () => {
          requests++;
          if (requests === 1) throw new AuthenticationError('transport', 'Błąd transportu.');
          return challenge;
        },
        confirmCode: async () => ({ verificationToken: 'token' }),
        invalidateChallenge: async () => {},
      },
    });

    try {
      await module.start('jane@example.com');
    } catch {
      // The caller displays the module's send-error state and can retry.
    }
    expect(module.status).to.equal('send-error');
    await module.start('jane@example.com');
    expect(requests).to.equal(2);
    expect(module.status).to.equal('awaiting-code');
  });
  it('starts an email challenge through its adapter and retains the challenge state', async () => {
    const requests: unknown[] = [];
    const adapter: AuthenticationAdapter = {
      confirmCode: async () => ({ verificationToken: 'token' }),
      requestCode: async request => {
        requests.push(request);
        return challenge;
      },
      invalidateChallenge: async () => {},
    };
    const module = new AuthenticationModule({
      applicationId: 'application-1',
      channel: 'email',
      adapter,
    });

    await module.start('jane@example.com');

    expect(requests).to.deep.equal([
      {
        applicationId: 'application-1',
        channel: 'email',
        contact: 'jane@example.com',
      },
    ]);
    expect(module.status).to.equal('awaiting-code');
    expect(module.contact).to.equal('jane@example.com');
    expect(module.challenge).to.deep.equal(challenge);
  });

  it('does not issue a second request while the first one is pending', async () => {
    let resolveRequest!: (value: CodeChallenge) => void;
    let requestCount = 0;
    const adapter: AuthenticationAdapter = {
      confirmCode: async () => ({ verificationToken: 'token' }),
      requestCode: () => {
        requestCount++;
        return new Promise(resolve => {
          resolveRequest = resolve;
        });
      },
      invalidateChallenge: async () => {},
    };
    const module = new AuthenticationModule({
      applicationId: 'application-1',
      channel: 'email',
      adapter,
    });

    const firstRequest = module.start('jane@example.com');
    const secondRequest = module.start('jane@example.com');

    expect(module.status).to.equal('sending');
    expect(requestCount).to.equal(1);

    resolveRequest(challenge);
    await Promise.all([firstRequest, secondRequest]);

    expect(module.status).to.equal('awaiting-code');
  });

  it('does not let a stale request restore a challenge after the contact is cleared', async () => {
    let resolveOld!: (value: CodeChallenge) => void;
    let resolveNew!: (value: CodeChallenge) => void;
    const invalidatedChallengeIds: string[] = [];
    const adapter: AuthenticationAdapter = {
      confirmCode: async () => ({ verificationToken: 'token' }),
      invalidateChallenge: async ({ challengeId }) => { invalidatedChallengeIds.push(challengeId); },
      requestCode: request => new Promise(resolve => {
        if (request.contact === 'old@example.com') resolveOld = resolve;
        else resolveNew = resolve;
      }),
    };
    const module = new AuthenticationModule({
      applicationId: 'application-1',
      channel: 'email',
      adapter,
    });

    const oldRequest = module.start('old@example.com');
    module.clear();
    const newRequest = module.start('new@example.com');

    resolveOld({ ...challenge, challengeId: 'old-challenge' });
    await oldRequest;
    await new Promise(resolve => setTimeout(resolve, 0));
    resolveNew({ ...challenge, challengeId: 'new-challenge' });
    await newRequest;

    expect(module.contact).to.equal('new@example.com');
    expect(module.challenge?.challengeId).to.equal('new-challenge');
    expect(invalidatedChallengeIds).to.deep.equal(['old-challenge']);
  });
});
