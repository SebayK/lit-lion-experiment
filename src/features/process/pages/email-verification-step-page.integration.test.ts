import { expect } from '@esm-bundle/chai';
import { LitElement } from 'lit';
import { ContextConsumer } from '@lit/context';
import { processContext } from '../context.js';
import { ProcessShell } from '../process-shell.js';
import '../process-shell.js';
import { EmailVerificationStepPage } from './email-verification-step-page.js';
import { AuthenticationModule } from '../../authentication/authentication-module.js';
import { HttpAuthenticationAdapter } from '../../authentication/authentication-adapter.js';
import { AuthenticationCodeVerification } from '../../authentication/authentication-code-verification.js';
import { authenticationHandlers, configureMockAuthentication } from '../../../mocks/authentication-handlers.js';

class ProcessProbe extends LitElement {
  readonly process = new ContextConsumer(this, { context: processContext });
}
customElements.define('email-process-probe', ProcessProbe);

const adapter = new HttpAuthenticationAdapter(async (input, init) => {
  const request = new Request(input, init);
  const route = authenticationHandlers.find(route => route.method.toUpperCase() === request.method && route.endpoint === new URL(request.url).pathname);
  if (!route) throw new Error('No authentication mock route');
  return route.handler({ request, cookies: {}, params: {} });
});

async function settle(element: LitElement): Promise<void> {
  await element.updateComplete;
  await new Promise(resolve => setTimeout(resolve, 0));
  await element.updateComplete;
}

describe('Email authentication in Process Shell', () => {
  let shell: ProcessShell;
  const originalUrl = window.location.href;

  afterEach(() => {
    shell?.remove();
    window.history.replaceState({}, '', originalUrl);
    configureMockAuthentication({ correctCode: '123456' });
  });

  it('stores the token and navigates to phone only after explicit successful confirmation', async () => {
    configureMockAuthentication({ correctCode: '102030' });
    shell = document.createElement('process-shell') as ProcessShell;
    const probe = document.createElement('email-process-probe') as ProcessProbe;
    shell.appendChild(probe);
    document.body.appendChild(shell);
    await settle(shell);
    const controller = probe.process.value!;
    controller.completeCalculation({ loanAmount: 1, periodMonths: 1, monthlyInstallment: 1 });
    controller.completeClientProfile();
    controller.completeIncome();
    await shell.routes.goto('/email-verification');
    await settle(shell);
    const page = shell.shadowRoot!.querySelector('email-verification-step-page') as EmailVerificationStepPage;
    page.authenticationModule = new AuthenticationModule({ applicationId: controller.applicationId, channel: 'email', adapter });
    await settle(page);
    const email = page.shadowRoot!.querySelector('input[type="email"]') as HTMLInputElement;
    email.value = ' Jane@Example.COM ';
    email.dispatchEvent(new Event('input'));
    await settle(page);
    (page.shadowRoot!.querySelector('button.btn-primary') as HTMLButtonElement).click();
    await settle(page);
    expect(controller.stepStatuses['email-verification']).to.equal('pending');
    expect(controller.emailVerificationToken).to.be.null;
    expect(controller.canAccess('phone-verification')).to.be.false;

    const component = page.shadowRoot!.querySelector('authentication-code-verification') as AuthenticationCodeVerification;
    await settle(component);
    const code = component.shadowRoot!.querySelector('input#code') as HTMLInputElement;
    code.value = '654321';
    code.dispatchEvent(new Event('input'));
    await settle(component);
    (component.shadowRoot!.querySelector('button') as HTMLButtonElement).click();
    await settle(component);
    expect(component.shadowRoot!.textContent).to.include('Niepoprawny kod');
    expect(controller.emailVerificationToken).to.be.null;
    expect(controller.canAccess('phone-verification')).to.be.false;
    expect(window.location.pathname).not.to.equal('/process/phone-verification');

    code.value = '102030';
    code.dispatchEvent(new Event('input'));
    await settle(component);
    expect(controller.canAccess('phone-verification')).to.be.false;
    (component.shadowRoot!.querySelector('button') as HTMLButtonElement).click();
    await settle(shell);
    expect(controller.email).to.equal('jane@example.com');
    expect(controller.emailVerificationToken).to.be.a('string').and.not.equal('102030');
    expect(controller.canAccess('phone-verification')).to.be.true;
    expect(controller.canAccess('dashboard')).to.be.false;
    expect(window.location.pathname).to.equal('/process/phone-verification');
    expect(shell.shadowRoot!.querySelector('a[href="/process/phone-verification"]')).to.exist;
    expect(shell.shadowRoot!.querySelector('a[href="/process/dashboard"]')).not.to.exist;
  });
});
