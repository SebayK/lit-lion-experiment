import { expect } from '@esm-bundle/chai';
import { AuthenticationModule } from '../../authentication/authentication-module.js';
import { EmailVerificationStepPage, normalizeEmail } from './email-verification-step-page.js';
import { ProcessController } from '../controllers/process-controller.js';
import type { ReactiveControllerHost } from 'lit';
import { ContextProvider } from '@lit/context';
import { processContext } from '../context.js';
import { AuthenticationCodeVerification } from '../../authentication/authentication-code-verification.js';

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
  let providerHost: HTMLElement;

  function mount(controller: ProcessController, module?: AuthenticationModule): void {
    providerHost = document.createElement('div');
    new ContextProvider(providerHost, { context: processContext, initialValue: controller });
    page = document.createElement('email-verification-step-page') as EmailVerificationStepPage;
    page.authenticationModule = module;
    providerHost.appendChild(page);
    document.body.appendChild(providerHost);
  }

  afterEach(() => providerHost?.remove());

  it('registers replacement-module cleanup after a detached reset and reconnect', async () => {
    const controller = new ProcessController(new TestHost());
    function createModule(): AuthenticationModule {
      return new AuthenticationModule({
        applicationId: controller.applicationId, channel: 'email',
        adapter: {
          requestCode: async () => ({ challengeId: controller.applicationId, expiresAt: '2026-10-02T12:05:00Z', resendAvailableAt: '2026-10-02T12:01:00Z' }),
          confirmCode: async () => ({ verificationToken: 'token' }),
        },
      });
    }
    const originalModule = createModule();
    mount(controller, originalModule);
    await page.updateComplete;
    await originalModule.start('jane@example.com');
    page.remove();
    controller.reset();
    expect(originalModule.challenge).to.be.null;
    const replacement = createModule();
    page.authenticationModule = replacement;
    providerHost.appendChild(page);
    await page.updateComplete;
    const email = page.shadowRoot!.querySelector('input[type="email"]') as HTMLInputElement;
    email.value = 'jane@example.com';
    email.dispatchEvent(new Event('input'));
    await page.updateComplete;
    (page.shadowRoot!.querySelector('button.btn-primary') as HTMLButtonElement).click();
    await new Promise(resolve => setTimeout(resolve, 0));
    const component = page.shadowRoot!.querySelector('authentication-code-verification') as AuthenticationCodeVerification;
    await component.updateComplete;
    const code = component.shadowRoot!.querySelector('input#code') as HTMLInputElement;
    code.value = '102030';
    code.dispatchEvent(new Event('input'));
    await component.updateComplete;
    (component.shadowRoot!.querySelector('button') as HTMLButtonElement).click();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(replacement.result).to.deep.equal({ verificationToken: 'token' });
    page.remove();
    expect(replacement.result).to.deep.equal({ verificationToken: 'token' });
    controller.reset();
    expect(replacement.result).to.be.null;
    expect(replacement.challenge).to.be.null;
    expect(replacement.status).to.equal('idle');
  });

  it('clears an injected pending confirmation immediately when the Application Process resets while the page is detached', async () => {
    const controller = new ProcessController(new TestHost());
    let resolveConfirmation!: (result: { verificationToken: string }) => void;
    const module = new AuthenticationModule({
      applicationId: controller.applicationId, channel: 'email',
      adapter: {
        requestCode: async () => ({ challengeId: 'detached-challenge', expiresAt: '2026-10-02T12:05:00Z', resendAvailableAt: '2026-10-02T12:01:00Z' }),
        confirmCode: () => new Promise(resolve => { resolveConfirmation = resolve; }),
      },
    });
    mount(controller, module);
    await page.updateComplete;
    const email = page.shadowRoot!.querySelector('input[type="email"]') as HTMLInputElement;
    email.value = 'jane@example.com';
    email.dispatchEvent(new Event('input'));
    await page.updateComplete;
    (page.shadowRoot!.querySelector('button.btn-primary') as HTMLButtonElement).click();
    await new Promise(resolve => setTimeout(resolve, 0));
    const component = page.shadowRoot!.querySelector('authentication-code-verification') as AuthenticationCodeVerification;
    await component.updateComplete;
    const code = component.shadowRoot!.querySelector('input#code') as HTMLInputElement;
    code.value = '102030';
    code.dispatchEvent(new Event('input'));
    await component.updateComplete;
    (component.shadowRoot!.querySelector('button') as HTMLButtonElement).click();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(module.status).to.equal('verifying');
    page.remove();
    expect(module.status).to.equal('verifying');
    controller.reset();
    expect(module.status).to.equal('idle');
    expect(module.challenge).to.be.null;
    expect(module.result).to.be.null;
    resolveConfirmation({ verificationToken: 'stale-token' });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(module.result).to.be.null;
    providerHost.appendChild(page);
    await page.updateComplete;
    await component.updateComplete;
    expect(component.shadowRoot!.querySelector('input#code')).not.to.exist;
    expect(controller.emailVerificationToken).to.be.null;
  });

  it('replaces its owned challenge with the new application after reset and accepts a fresh request', async () => {
    const controller = new ProcessController(new TestHost());
    const applicationIds: string[] = [];
    mount(controller);
    page.authenticationAdapter = {
      requestCode: async request => {
        applicationIds.push(request.applicationId);
        return { challengeId: 'challenge-1', expiresAt: '2026-10-02T12:05:00Z', resendAvailableAt: '2026-10-02T12:01:00Z' };
      },
      confirmCode: async () => ({ verificationToken: 'token' }),
    };
    await page.updateComplete;
    const input = page.shadowRoot!.querySelector('input[type="email"]') as HTMLInputElement;
    input.value = 'jane@example.com';
    input.dispatchEvent(new Event('input'));
    await page.updateComplete;
    (page.shadowRoot!.querySelector('button.btn-primary') as HTMLButtonElement).click();
    await new Promise(resolve => setTimeout(resolve, 0));
    const component = page.shadowRoot!.querySelector('authentication-code-verification') as AuthenticationCodeVerification;
    const oldModule = component.module!;
    await oldModule.confirm('102030');
    const originalApplication = controller.applicationId;
    controller.reset();
    await page.updateComplete;
    expect(oldModule.result).to.be.null;
    expect(oldModule.challenge).to.be.null;
    expect(input.value).to.equal('');
    input.value = 'jane@example.com';
    input.dispatchEvent(new Event('input'));
    await page.updateComplete;
    (page.shadowRoot!.querySelector('button.btn-primary') as HTMLButtonElement).click();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(applicationIds).to.deep.equal([originalApplication, controller.applicationId]);
    expect(component.module!.status).to.equal('awaiting-code');
  });

  it('clears an in-flight challenge and authentication result when the Application Process resets', async () => {
    const controller = new ProcessController(new TestHost());
    let resolveConfirmation!: (result: { verificationToken: string }) => void;
    const module = new AuthenticationModule({
      applicationId: controller.applicationId, channel: 'email',
      adapter: {
        requestCode: async () => ({ challengeId: 'challenge-1', expiresAt: '2026-10-02T12:05:00Z', resendAvailableAt: '2026-10-02T12:01:00Z' }),
        confirmCode: () => new Promise(resolve => { resolveConfirmation = resolve; }),
      },
    });
    mount(controller, module);
    await page.updateComplete;
    await module.start('jane@example.com');
    const confirmation = module.confirm('102030');
    await Promise.resolve();
    controller.reset();
    await page.updateComplete;
    resolveConfirmation({ verificationToken: 'stale-token' });
    await confirmation;
    expect(module.status).to.equal('idle');
    expect(module.result).to.be.null;
    expect(module.challenge).to.be.null;
    expect(controller.emailVerificationToken).to.be.null;
  });

  it('preserves an injected challenge across page remounts and reconnects its UI and process subscriptions', async () => {
    const controller = new ProcessController(new TestHost());
    let requests = 0;
    const module = new AuthenticationModule({
      applicationId: controller.applicationId, channel: 'email',
      adapter: {
        requestCode: async () => {
          requests++;
          return { challengeId: 'external-challenge', expiresAt: '2026-10-02T12:05:00Z', resendAvailableAt: '2026-10-02T12:01:00Z' };
        },
        confirmCode: async ({ code }) => {
          if (code !== '102030') throw new Error('Niepoprawny kod. Spróbuj ponownie.');
          return { verificationToken: 'external-token' };
        },
      },
    });
    mount(controller, module);
    await page.updateComplete;
    await module.start('jane@example.com');
    await page.updateComplete;
    page.remove();
    expect(module.status).to.equal('awaiting-code');
    expect(module.challenge?.challengeId).to.equal('external-challenge');
    providerHost.appendChild(page);
    await page.updateComplete;
    const component = page.shadowRoot!.querySelector('authentication-code-verification') as AuthenticationCodeVerification;
    await component.updateComplete;
    expect(component.shadowRoot!.textContent).to.include('ja**@example.com');
    const input = component.shadowRoot!.querySelector('input#code') as HTMLInputElement;
    input.value = '654321';
    input.dispatchEvent(new Event('input'));
    await component.updateComplete;
    (component.shadowRoot!.querySelector('button') as HTMLButtonElement).click();
    await new Promise(resolve => setTimeout(resolve, 0));
    await component.updateComplete;
    expect(component.shadowRoot!.querySelector('[role="alert"]')?.textContent).to.include('Niepoprawny kod');
    input.value = '102030';
    input.dispatchEvent(new Event('input'));
    await component.updateComplete;
    (component.shadowRoot!.querySelector('button') as HTMLButtonElement).click();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(module.result).to.deep.equal({ verificationToken: 'external-token' });
    expect(requests).to.equal(1);
    controller.reset();
    await page.updateComplete;
    expect(module.status).to.equal('idle');
    expect(module.challenge).to.be.null;
    expect(module.result).to.be.null;
  });

  it('forwards successful authentication to its parent without completing the Process Step itself', async () => {
    const controller = new ProcessController(new TestHost());
    controller.completeCalculation({ loanAmount: 1, periodMonths: 1, monthlyInstallment: 1 });
    controller.completeClientProfile();
    controller.completeIncome();
    const module = new AuthenticationModule({
      applicationId: controller.applicationId, channel: 'email',
      adapter: {
        requestCode: async () => ({ challengeId: 'challenge-1', expiresAt: '2026-10-02T12:05:00Z', resendAvailableAt: '2026-10-02T12:01:00Z' }),
        confirmCode: async () => ({ verificationToken: 'opaque-token' }),
      },
    });
    mount(controller, module);
    await page.updateComplete;
    const results: unknown[] = [];
    providerHost.addEventListener('email-verification-success', event => results.push((event as CustomEvent).detail));
    const input = page.shadowRoot!.querySelector('input[type="email"]') as HTMLInputElement;
    input.value = 'jane@example.com';
    input.dispatchEvent(new Event('input'));
    await page.updateComplete;
    (page.shadowRoot!.querySelector('button.btn-primary') as HTMLButtonElement).click();
    await new Promise(resolve => setTimeout(resolve, 0));
    const component = page.shadowRoot!.querySelector('authentication-code-verification') as AuthenticationCodeVerification;
    await component.updateComplete;
    const code = component.shadowRoot!.querySelector('input#code') as HTMLInputElement;
    code.value = '102030';
    code.dispatchEvent(new Event('input'));
    await component.updateComplete;
    (component.shadowRoot!.querySelector('button') as HTMLButtonElement).click();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(results).to.deep.equal([{ applicationId: controller.applicationId, email: 'jane@example.com', verificationToken: 'opaque-token' }]);
    expect(controller.canAccess('phone-verification')).to.be.false;
  });

  it('normalizes a valid email before starting the challenge and leaves the process step pending', async () => {
    const requests: string[] = [];
    const module = new AuthenticationModule({
      applicationId: 'application-1',
      channel: 'email',
      adapter: {
        confirmCode: async () => ({ verificationToken: 'token' }),
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

    mount(processController, module);
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
        confirmCode: async () => ({ verificationToken: 'token' }),
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

    mount(processController, module);
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
