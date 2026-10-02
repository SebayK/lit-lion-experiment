import type {
  AuthenticationAdapter,
  CodeChallenge,
  RequestCode,
} from './authentication-module.js';

export const REQUEST_CODE_ENDPOINT = '/api/authentication/code/request';

export type FetchAuthenticationRequest = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export class HttpAuthenticationAdapter implements AuthenticationAdapter {
  private readonly fetchRequest: FetchAuthenticationRequest;

  constructor(fetchRequest: FetchAuthenticationRequest = fetch) {
    this.fetchRequest = fetchRequest;
  }

  async requestCode(request: RequestCode): Promise<CodeChallenge> {
    const response = await this.fetchRequest(REQUEST_CODE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Nie udało się wysłać kodu.');
    }

    const body = (await response.json()) as Partial<CodeChallenge>;
    if (!body.challengeId || !body.expiresAt || !body.resendAvailableAt) {
      throw new Error('Odpowiedź serwera nie zawiera danych wyzwania.');
    }

    return {
      challengeId: body.challengeId,
      expiresAt: body.expiresAt,
      resendAvailableAt: body.resendAvailableAt,
    };
  }
}
