import { expect } from '@esm-bundle/chai';
import {
  AuthenticationModule,
  type AuthenticationAdapter,
  type CodeChallenge,
} from './authentication-module.js';

const challenge: CodeChallenge = {
  challengeId: 'challenge-1',
  expiresAt: '2026-10-02T12:05:00.000Z',
  resendAvailableAt: '2026-10-02T12:01:00.000Z',
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
          if (code !== '102030') throw new Error('Niepoprawny kod. Spróbuj ponownie.');
          return { verificationToken: 'token' };
        },
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
      },
    });
    await module.start('jane@example.com');

    await module.confirm('102030');

    expect(module.status).to.equal('success');
    expect(module.result).to.deep.equal({ verificationToken: 'opaque-token' });
  });
  it('starts an email challenge through its adapter and retains the challenge state', async () => {
    const requests: unknown[] = [];
    const adapter: AuthenticationAdapter = {
      confirmCode: async () => ({ verificationToken: 'token' }),
      requestCode: async request => {
        requests.push(request);
        return challenge;
      },
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
    const adapter: AuthenticationAdapter = {
      confirmCode: async () => ({ verificationToken: 'token' }),
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

    resolveNew({ ...challenge, challengeId: 'new-challenge' });
    await newRequest;
    resolveOld({ ...challenge, challengeId: 'old-challenge' });
    await oldRequest;

    expect(module.contact).to.equal('new@example.com');
    expect(module.challenge?.challengeId).to.equal('new-challenge');
  });
});
