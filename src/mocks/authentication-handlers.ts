import { http } from '@web/mocks/http.js';
import { isValidCode, type AuthenticationChannel, type CodeChallenge, type RequestCode, type ConfirmCode, type InvalidateChallenge } from '../features/authentication/authentication-module.js';

export interface MockAuthenticationConfig {
  correctCode?: string;
  now?: () => number;
  expireChallenges?: boolean;
  failRequests?: boolean;
}

let correctMockCode = '123456';
let mockNow: () => number = Date.now;
let expireChallenges = false;
let failRequests = false;

/** Configures backend-only test data. The code is never included in responses. */
export function configureMockAuthentication(config: MockAuthenticationConfig): void {
  if (config.correctCode !== undefined && !isValidCode(config.correctCode)) {
    throw new Error('Mock authentication code must contain six digits and not start with zero.');
  }

  if (config.correctCode !== undefined) {
    correctMockCode = config.correctCode;
  }
  if (config.now !== undefined) mockNow = config.now;
  if (config.expireChallenges !== undefined) expireChallenges = config.expireChallenges;
  if (config.failRequests !== undefined) failRequests = config.failRequests;
}

export function getConfiguredMockAuthenticationCode(): string {
  return correctMockCode;
}

const challenges = new Map<string, { request: RequestCode; code: string; challenge: CodeChallenge; attempts: number; locked: boolean }>();
const activeChallengeIds = new Map<string, string>();
const resendAvailableAtByRequest = new Map<string, number>();

export function resetMockAuthentication(): void {
  correctMockCode = '123456';
  mockNow = Date.now;
  expireChallenges = false;
  failRequests = false;
  challenges.clear();
  activeChallengeIds.clear();
  resendAvailableAtByRequest.clear();
}

function createChallengeId(): string {
  if ('randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `challenge-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isAuthenticationChannel(value: unknown): value is AuthenticationChannel {
  return value === 'email' || value === 'phone';
}

function challengeScopeKey(request: Pick<RequestCode, 'applicationId' | 'channel'>): string {
  return JSON.stringify([request.applicationId, request.channel]);
}

function requestKey(request: RequestCode): string {
  return JSON.stringify([request.applicationId, request.channel, request.contact]);
}

export const authenticationHandlers = [
  http.post('/api/authentication/code/invalidate', async ({ request }) => {
    const body = (await request.json()) as Partial<InvalidateChallenge>;
    const active = typeof body.challengeId === 'string' ? challenges.get(body.challengeId) : undefined;
    if (!active || body.applicationId !== active.request.applicationId || body.channel !== active.request.channel) {
      return Response.json({ code: 'invalid_code', message: 'Nie znaleziono aktywnego wyzwania.' }, { status: 404 });
    }
    challenges.delete(active.challenge.challengeId);
    activeChallengeIds.delete(challengeScopeKey(active.request));
    return new Response(null, { status: 204 });
  }),
  http.post('/api/authentication/code/confirm', async ({ request }) => {
    const body = (await request.json()) as Partial<ConfirmCode>;
    const active = typeof body.challengeId === 'string' ? challenges.get(body.challengeId) : undefined;
    if (!active || body.applicationId !== active.request.applicationId || body.channel !== active.request.channel) {
      return Response.json({ code: 'invalid_code', message: 'Niepoprawny kod. Spróbuj ponownie.' }, { status: 400 });
    }
    if (active.locked) {
      return Response.json({ code: 'challenge_locked', message: 'Wyzwanie zostało zablokowane. Rozpocznij nowe.' }, { status: 423 });
    }
    if (expireChallenges || mockNow() >= Date.parse(active.challenge.expiresAt)) {
      return Response.json({ code: 'challenge_expired', message: 'Kod wygasł. Rozpocznij nowe wyzwanie.' }, { status: 410 });
    }
    if (typeof body.code !== 'string' || !isValidCode(body.code) || body.code !== active.code) {
      active.attempts++;
      if (active.attempts >= 5) {
        active.locked = true;
        return Response.json({ code: 'challenge_locked', message: 'Wyzwanie zostało zablokowane. Rozpocznij nowe.' }, { status: 423 });
      }
      return Response.json({ code: 'invalid_code', message: 'Niepoprawny kod. Spróbuj ponownie.' }, { status: 400 });
    }
    challenges.delete(active.challenge.challengeId);
    activeChallengeIds.delete(challengeScopeKey(active.request));
    return Response.json({ verificationToken: createChallengeId() });
  }),
  http.post('/api/authentication/code/request', async ({ request }) => {
    const body = (await request.json()) as Partial<RequestCode>;
    if (!body.applicationId || !isAuthenticationChannel(body.channel) || !body.contact) {
      return Response.json({ message: 'Invalid authentication request.' }, { status: 400 });
    }

    const requestData: RequestCode = {
      applicationId: body.applicationId,
      channel: body.channel,
      contact: body.contact,
    };
    const challengeScope = challengeScopeKey(requestData);
    const oldChallengeId = activeChallengeIds.get(challengeScope);
    const oldChallenge = oldChallengeId ? challenges.get(oldChallengeId) : undefined;
    if (oldChallengeId && oldChallenge && oldChallenge.request.contact !== requestData.contact) {
      challenges.delete(oldChallengeId);
      activeChallengeIds.delete(challengeScope);
    }

    if (failRequests) return Response.json({ code: 'transport', message: 'Nie udało się wysłać kodu.' }, { status: 503 });

    const resendAt = resendAvailableAtByRequest.get(requestKey(requestData));
    if (resendAt !== undefined && mockNow() < resendAt) {
      return Response.json({ code: 'resend_cooldown', message: 'Możesz ponownie wysłać kod za chwilę.' }, { status: 429 });
    }

    const now = mockNow();
    const challenge: CodeChallenge = {
      challengeId: createChallengeId(),
      expiresAt: new Date(now + (expireChallenges ? -1 : 5 * 60 * 1000)).toISOString(),
      resendAvailableAt: new Date(now + 60 * 1000).toISOString(),
    };

    const currentChallengeId = activeChallengeIds.get(challengeScope);
    if (currentChallengeId) challenges.delete(currentChallengeId);
    activeChallengeIds.set(challengeScope, challenge.challengeId);
    resendAvailableAtByRequest.set(requestKey(requestData), Date.parse(challenge.resendAvailableAt));

    challenges.set(challenge.challengeId, {
      request: requestData,
      code: correctMockCode,
      challenge,
      attempts: 0,
      locked: false,
    });

    return Response.json(challenge, { status: 200 });
  }),
];
