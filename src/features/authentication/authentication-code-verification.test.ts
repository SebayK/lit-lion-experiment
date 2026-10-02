import { expect } from '@esm-bundle/chai';
import { AuthenticationModule, type CodeChallenge } from './authentication-module.js';
import './authentication-code-verification.js';
import { AuthenticationCodeVerification } from './authentication-code-verification.js';

const challenge: CodeChallenge = {
  challengeId: 'challenge-1',
  expiresAt: '2026-10-02T12:05:00.000Z',
  resendAvailableAt: '2026-10-02T12:01:00.000Z',
};

async function settle(element: AuthenticationCodeVerification): Promise<void> {
  await element.updateComplete;
  await new Promise(resolve => setTimeout(resolve, 0));
  await element.updateComplete;
}

describe('AuthenticationCodeVerification', () => {
  let element: AuthenticationCodeVerification;

  afterEach(() => element?.remove());

  it('does not request a code when it is mounted and rendered', async () => {
    let requestCount = 0;
    const module = new AuthenticationModule({
      applicationId: 'application-1',
      channel: 'email',
      adapter: {
        requestCode: async () => {
          requestCount++;
          return challenge;
        },
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
      adapter: { requestCode: async () => challenge },
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
});
