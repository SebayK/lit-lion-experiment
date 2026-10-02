import { expect } from '@esm-bundle/chai';
import { AuthenticationModule } from '../../authentication/authentication-module.js';
import { EmailVerificationStepPage, normalizeEmail } from './email-verification-step-page.js';
import { ProcessController } from '../controllers/process-controller.js';
import type { ReactiveControllerHost } from 'lit';

class TestHost implements ReactiveControllerHost {
  addController(): void {}
  removeController(): void {}
  requestUpdate(): void {}
  updateComplete = Promise.resolve(true);
}

if (!customElements.get('email-verification-step-page')) {
  customElements.define('email-verification-step-page', EmailVerificationStepPage);
}

describe('EmailVerificationStepPage', () => {
  let page: EmailVerificationStepPage;

  afterEach(() => page?.remove());

  it('normalizes a valid email before starting the challenge and leaves the process step pending', async () => {
    const requests: string[] = [];
    const module = new AuthenticationModule({
      applicationId: 'application-1',
      channel: 'email',
      adapter: {
        requestCode: async request => {
          requests.push(request.contact);
          return {
            challengeId: 'challenge-1',
            expiresAt: '2026-10-02T12:05:00.000Z',
            resendAvailableAt: '2026-10-02T12:01:00.000Z',
          };
        },
      },
    });
    const processController = new ProcessController(new TestHost());
    processController.completeCalculation({ loanAmount: 1, periodMonths: 1, monthlyInstallment: 1 });
    processController.completeClientProfile();
    processController.completeIncome();

    page = document.createElement('email-verification-step-page') as EmailVerificationStepPage;
    (page as unknown as { processCtrl: ProcessController }).processCtrl = processController;
    page.authenticationModule = module;
    document.body.appendChild(page);
    await page.updateComplete;

    const input = page.shadowRoot!.querySelector('input[type="email"]') as HTMLInputElement;
    input.value = '  Jane@Example.COM ';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await page.updateComplete;
    (page.shadowRoot!.querySelector('button.btn-primary') as HTMLButtonElement).click();
    await page.updateComplete;

    expect(normalizeEmail('  Jane@Example.COM ')).to.equal('jane@example.com');
    expect(requests).to.deep.equal(['jane@example.com']);
    expect(processController.stepStatuses['email-verification']).to.equal('pending');
    expect(processController.canAccess('phone-verification')).to.be.false;
  });

  it('does not request a code for an invalid email', async () => {
    let requestCount = 0;
    const module = new AuthenticationModule({
      applicationId: 'application-1',
      channel: 'email',
      adapter: {
        requestCode: async () => {
          requestCount++;
          return {
            challengeId: 'challenge-1',
            expiresAt: '2026-10-02T12:05:00.000Z',
            resendAvailableAt: '2026-10-02T12:01:00.000Z',
          };
        },
      },
    });
    const processController = new ProcessController(new TestHost());

    page = document.createElement('email-verification-step-page') as EmailVerificationStepPage;
    (page as unknown as { processCtrl: ProcessController }).processCtrl = processController;
    page.authenticationModule = module;
    document.body.appendChild(page);
    await page.updateComplete;

    const input = page.shadowRoot!.querySelector('input[type="email"]') as HTMLInputElement;
    input.value = 'not-an-email';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await page.updateComplete;
    (page.shadowRoot!.querySelector('button.btn-primary') as HTMLButtonElement).click();
    await page.updateComplete;

    expect(requestCount).to.equal(0);
    expect(page.shadowRoot!.textContent).to.include('Podaj prawidłowy adres email');
  });
});
