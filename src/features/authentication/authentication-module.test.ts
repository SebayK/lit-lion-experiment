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
  it('starts an email challenge through its adapter and retains the challenge state', async () => {
    const requests: unknown[] = [];
    const adapter: AuthenticationAdapter = {
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
