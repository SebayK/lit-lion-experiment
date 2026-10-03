import { expect } from '@esm-bundle/chai';
import { HttpAuthenticationAdapter } from './authentication-adapter.js';
import { authenticationHandlers, configureMockAuthentication } from '../../mocks/authentication-handlers.js';

const mockAdapter = new HttpAuthenticationAdapter(async (input, init) => {
  const request = new Request(input, init);
  const route = authenticationHandlers.find(route => route.method.toUpperCase() === request.method && route.endpoint === new URL(request.url).pathname);
  if (!route) throw new Error('No authentication mock route');
  return route.handler({ request, cookies: {}, params: {} });
});

async function confirmationError(applicationId: string, challengeId: string, code: string): Promise<string> {
  try {
    await mockAdapter.confirmCode({ applicationId, challengeId, code });
    return '';
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

describe('HttpAuthenticationAdapter', () => {
  afterEach(() => configureMockAuthentication({ correctCode: '123456' }));

  it('checks codes against their own application and challenge through the HTTP mock', async () => {
    configureMockAuthentication({ correctCode: '102030' });
    const first = await mockAdapter.requestCode({ applicationId: 'application-a', channel: 'email', contact: 'jane@example.com' });
    configureMockAuthentication({ correctCode: '654321' });
    const second = await mockAdapter.requestCode({ applicationId: 'application-b', channel: 'email', contact: 'jane@example.com' });

    expect(await confirmationError('application-b', first.challengeId, '102030')).to.include('Niepoprawny kod');
    expect(await confirmationError('application-a', 'unknown-challenge', '102030')).to.include('Niepoprawny kod');
    expect(await confirmationError('application-a', first.challengeId, '654321')).to.include('Niepoprawny kod');
    expect(await confirmationError('application-a', first.challengeId, '012345')).to.include('Niepoprawny kod');
    const firstResult = await mockAdapter.confirmCode({ applicationId: 'application-a', challengeId: first.challengeId, code: '102030' });
    const secondResult = await mockAdapter.confirmCode({ applicationId: 'application-b', challengeId: second.challengeId, code: '654321' });
    expect(firstResult.verificationToken).to.be.a('string').and.not.equal('102030');
    expect(firstResult.verificationToken).not.to.equal(secondResult.verificationToken);
    expect(await confirmationError('application-a', first.challengeId, '102030')).to.include('Niepoprawny kod');
  });
  it('posts the application, challenge and code and returns an opaque token', async () => {
    let request: Request | undefined;
    const adapter = new HttpAuthenticationAdapter(async (input, init) => {
      request = new Request(input, init);
      return Response.json({ verificationToken: 'opaque-token' });
    });
    const result = await adapter.confirmCode({ applicationId: 'application-1', challengeId: 'challenge-1', code: '102030' });
    expect(request?.method).to.equal('POST');
    expect(new URL(request!.url).pathname).to.equal('/api/authentication/code/confirm');
    expect(await request?.json()).to.deep.equal({ applicationId: 'application-1', challengeId: 'challenge-1', code: '102030' });
    expect(result).to.deep.equal({ verificationToken: 'opaque-token' });
  });
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

  it('requests a code through the browser fetch when using the default adapter', async () => {
    const originalFetch = window.fetch;
    window.fetch = function (this: Window): Promise<Response> {
      if (this !== window) {
        throw new TypeError("Failed to execute 'fetch' on 'Window': Illegal invocation");
      }

      return Promise.resolve(Response.json({
        challengeId: 'challenge-1',
        expiresAt: '2026-10-02T12:05:00.000Z',
        resendAvailableAt: '2026-10-02T12:01:00.000Z',
      }));
    } as typeof window.fetch;

    try {
      const adapter = new HttpAuthenticationAdapter();
      const challenge = await adapter.requestCode({
        applicationId: 'application-1',
        channel: 'email',
        contact: 'jane@example.com',
      });

      expect(challenge).to.deep.equal({
        challengeId: 'challenge-1',
        expiresAt: '2026-10-02T12:05:00.000Z',
        resendAvailableAt: '2026-10-02T12:01:00.000Z',
      });
    } finally {
      window.fetch = originalFetch;
    }
  });
});
