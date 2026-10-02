import { expect } from '@esm-bundle/chai';
import { HttpAuthenticationAdapter } from './authentication-adapter.js';

describe('HttpAuthenticationAdapter', () => {
  it('posts the application, channel, and contact and returns challenge metadata', async () => {
    let request: Request | undefined;
    const adapter = new HttpAuthenticationAdapter(async (input, init) => {
      request = new Request(input, init);
      return new Response(
        JSON.stringify({
          challengeId: 'challenge-1',
          expiresAt: '2026-10-02T12:05:00.000Z',
          resendAvailableAt: '2026-10-02T12:01:00.000Z',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    });

    const challenge = await adapter.requestCode({
      applicationId: 'application-1',
      channel: 'email',
      contact: 'jane@example.com',
    });

    expect(request?.method).to.equal('POST');
    expect(new URL(request!.url).pathname).to.equal('/api/authentication/code/request');
    expect(request?.headers.get('Content-Type')).to.equal('application/json');
    expect(await request?.json()).to.deep.equal({
      applicationId: 'application-1',
      channel: 'email',
      contact: 'jane@example.com',
    });
    expect(challenge.challengeId).to.equal('challenge-1');
    expect(challenge.expiresAt).to.equal('2026-10-02T12:05:00.000Z');
    expect(challenge.resendAvailableAt).to.equal('2026-10-02T12:01:00.000Z');
  });
});
