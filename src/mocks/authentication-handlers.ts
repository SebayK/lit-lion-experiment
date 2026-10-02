import { http } from '@web/mocks/http.js';
import { isValidCode, type AuthenticationChannel, type CodeChallenge, type RequestCode, type ConfirmCode } from '../features/authentication/authentication-module.js';

export interface MockAuthenticationConfig {
  correctCode?: string;
}

let correctMockCode = '123456';

/** Configures backend-only test data. The code is never included in responses. */
export function configureMockAuthentication(config: MockAuthenticationConfig): void {
  if (config.correctCode !== undefined && !isValidCode(config.correctCode)) {
    throw new Error('Mock authentication code must contain six digits and not start with zero.');
  }

  if (config.correctCode !== undefined) {
    correctMockCode = config.correctCode;
  }
}

export function getConfiguredMockAuthenticationCode(): string {
  return correctMockCode;
}

const challenges = new Map<string, { request: RequestCode; code: string; challenge: CodeChallenge }>();

function createChallengeId(): string {
  if ('randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `challenge-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isAuthenticationChannel(value: unknown): value is AuthenticationChannel {
  return value === 'email' || value === 'phone';
}

export const authenticationHandlers = [
  http.post('/api/authentication/code/confirm', async ({ request }) => {
    const body = (await request.json()) as Partial<ConfirmCode>;
    const active = typeof body.challengeId === 'string' ? challenges.get(body.challengeId) : undefined;
    if (!active || body.applicationId !== active.request.applicationId ||
        typeof body.code !== 'string' || !isValidCode(body.code) || body.code !== active.code) {
      return Response.json({ message: 'Niepoprawny kod. Spróbuj ponownie.' }, { status: 400 });
    }
    challenges.delete(active.challenge.challengeId);
    return Response.json({ verificationToken: createChallengeId() });
  }),
  http.post('/api/authentication/code/request', async ({ request }) => {
    const body = (await request.json()) as Partial<RequestCode>;
    if (!body.applicationId || !isAuthenticationChannel(body.channel) || !body.contact) {
      return Response.json({ message: 'Invalid authentication request.' }, { status: 400 });
    }

    const now = Date.now();
    const challenge: CodeChallenge = {
      challengeId: createChallengeId(),
      expiresAt: new Date(now + 5 * 60 * 1000).toISOString(),
      resendAvailableAt: new Date(now + 60 * 1000).toISOString(),
    };
    const requestData: RequestCode = {
      applicationId: body.applicationId,
      channel: body.channel,
      contact: body.contact,
    };

    challenges.set(challenge.challengeId, {
      request: requestData,
      code: correctMockCode,
      challenge,
    });

    return Response.json(challenge, { status: 200 });
  }),
];
