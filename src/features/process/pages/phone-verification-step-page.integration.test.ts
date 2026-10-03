import { expect } from '@esm-bundle/chai';
import { LitElement } from 'lit';
import { ContextConsumer } from '@lit/context';
import { processContext } from '../context.js';
import { ProcessShell } from '../process-shell.js';
import '../process-shell.js';
import { PhoneVerificationStepPage } from './phone-verification-step-page.js';
import { EmailVerificationStepPage } from './email-verification-step-page.js';
import { AuthenticationModule, type RequestCode } from '../../authentication/authentication-module.js';
import { AuthenticationCodeVerification } from '../../authentication/authentication-code-verification.js';

class ProcessProbe extends LitElement {
  readonly process = new ContextConsumer(this, { context: processContext });
}
customElements.define('phone-process-probe', ProcessProbe);

async function settle(element: LitElement): Promise<void> {
  await element.updateComplete;
  await new Promise(resolve => setTimeout(resolve, 0));
  await element.updateComplete;
}

describe('Phone authentication in Process Shell', () => {
  let shell: ProcessShell;
  const originalUrl = window.location.href;

  afterEach(() => {
    shell?.remove();
    window.history.replaceState({}, '', originalUrl);
  });

  it('completes email then phone verification before unlocking the dashboard', async () => {
    shell = document.createElement('process-shell') as ProcessShell;
    const probe = document.createElement('phone-process-probe') as ProcessProbe;
    shell.appendChild(probe);
    document.body.appendChild(shell);
    await settle(shell);
    const controller = probe.process.value!;
    controller.completeCalculation({ loanAmount: 1, periodMonths: 1, monthlyInstallment: 1 });
    controller.completeClientProfile();
    controller.completeIncome();
    expect(controller.canAccess('phone-verification')).to.be.false;
    await shell.routes.goto('/email-verification');
    await settle(shell);
    const emailPage = shell.shadowRoot!.querySelector('email-verification-step-page') as EmailVerificationStepPage;
    emailPage.authenticationModule = new AuthenticationModule({
      applicationId: controller.applicationId,
      channel: 'email',
      adapter: {
        requestCode: async () => ({ challengeId: 'email-challenge', expiresAt: '2026-10-03T12:05:00Z', resendAvailableAt: '2026-10-03T12:01:00Z' }),
        confirmCode: async ({ code }) => {
          if (code !== '102030') throw new Error('Niepoprawny kod. Spróbuj ponownie.');
          return { verificationToken: 'email-opaque-token' };
        },
      },
    });
    await settle(emailPage);
    const emailInput = emailPage.shadowRoot!.querySelector('input[type="email"]') as HTMLInputElement;
    emailInput.value = ' Jane@Example.COM ';
    emailInput.dispatchEvent(new Event('input'));
    await settle(emailPage);
    (emailPage.shadowRoot!.querySelector('button.btn-primary') as HTMLButtonElement).click();
    await settle(emailPage);
    const emailComponent = emailPage.shadowRoot!.querySelector('authentication-code-verification') as AuthenticationCodeVerification;
    await settle(emailComponent);
    const emailCode = emailComponent.shadowRoot!.querySelector('input#code') as HTMLInputElement;
    emailCode.value = '102030';
    emailCode.dispatchEvent(new Event('input'));
    await settle(emailComponent);
    expect(controller.canAccess('phone-verification')).to.be.false;
    (emailComponent.shadowRoot!.querySelector('button') as HTMLButtonElement).click();
    await settle(shell);
    expect(controller.email).to.equal('jane@example.com');
    expect(controller.emailVerificationToken).to.equal('email-opaque-token');
    expect(controller.stepStatuses['phone-verification']).to.equal('pending');
    expect(window.location.pathname).to.equal('/process/phone-verification');
    await shell.routes.goto('/phone-verification');
    await settle(shell);
    const page = shell.shadowRoot!.querySelector('phone-verification-step-page') as PhoneVerificationStepPage;
    let request: RequestCode | undefined;
    page.authenticationModule = new AuthenticationModule({
      applicationId: controller.applicationId,
      channel: 'phone',
      adapter: {
        requestCode: async data => {
          request = data;
          return { challengeId: 'phone-challenge', expiresAt: '2026-10-03T12:05:00Z', resendAvailableAt: '2026-10-03T12:01:00Z' };
        },
        confirmCode: async ({ applicationId, challengeId, code }) => {
          expect(applicationId).to.equal(controller.applicationId);
          expect(challengeId).to.equal('phone-challenge');
          if (code !== '102030') throw new Error('Niepoprawny kod. Spróbuj ponownie.');
          return { verificationToken: 'phone-opaque-token' };
        },
      },
    });
    await settle(page);
    const input = page.shadowRoot!.querySelector('input[type="tel"]') as HTMLInputElement;
    input.value = '123 456 789';
    input.dispatchEvent(new Event('input'));
    await settle(page);
    expect(request).to.be.undefined;
    (page.shadowRoot!.querySelector('button.btn-primary') as HTMLButtonElement).click();
    await settle(page);
    expect(request).to.deep.equal({ applicationId: controller.applicationId, channel: 'phone', contact: '+48123456789' });
    expect(controller.stepStatuses['phone-verification']).to.equal('pending');
    expect(controller.phoneVerificationToken).to.be.null;

    const component = page.shadowRoot!.querySelector('authentication-code-verification') as AuthenticationCodeVerification;
    await settle(component);
    expect(component.shadowRoot!.textContent).to.include('***789');
    const code = component.shadowRoot!.querySelector('input#code') as HTMLInputElement;
    code.value = '102030';
    code.dispatchEvent(new Event('input'));
    await settle(component);
    expect(controller.stepStatuses['phone-verification']).to.equal('pending');
    (component.shadowRoot!.querySelector('button') as HTMLButtonElement).click();
    await settle(shell);
    expect(controller.phone).to.equal('+48123456789');
    expect(controller.phoneVerificationToken).to.equal('phone-opaque-token');
    expect(controller.emailVerificationToken).to.equal('email-opaque-token');
    expect(controller.stepStatuses['phone-verification']).to.equal('completed');
    expect(controller.canAccess('dashboard')).to.be.true;
    expect(window.location.pathname).to.equal('/process/dashboard');
  });

  it('does not request a challenge for an invalid phone number', async () => {
    shell = document.createElement('process-shell') as ProcessShell;
    const probe = document.createElement('phone-process-probe') as ProcessProbe;
    shell.appendChild(probe);
    document.body.appendChild(shell);
    await settle(shell);
    const controller = probe.process.value!;
    controller.completeCalculation({ loanAmount: 1, periodMonths: 1, monthlyInstallment: 1 });
    controller.completeClientProfile();
    controller.completeIncome();
    controller.completeEmailVerification({ applicationId: controller.applicationId, email: 'jane@example.com', verificationToken: 'email-token' });
    await shell.routes.goto('/phone-verification');
    await settle(shell);
    const page = shell.shadowRoot!.querySelector('phone-verification-step-page') as PhoneVerificationStepPage;
    let requests = 0;
    page.authenticationAdapter = {
      requestCode: async () => { requests++; return { challengeId: 'challenge', expiresAt: '', resendAvailableAt: '' }; },
      confirmCode: async () => ({ verificationToken: 'token' }),
    };
    await settle(page);
    const input = page.shadowRoot!.querySelector('input[type="tel"]') as HTMLInputElement;
    input.value = '123';
    input.dispatchEvent(new Event('input'));
    await settle(page);
    (page.shadowRoot!.querySelector('button.btn-primary') as HTMLButtonElement).click();
    await settle(page);
    expect(requests).to.equal(0);
    expect(page.shadowRoot!.querySelector('[role="alert"]')?.textContent).to.include('prawidłowy numer');
  });
});
