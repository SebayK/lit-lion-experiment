import '@webcomponents/scoped-custom-element-registry';
import { expect } from '@esm-bundle/chai';
import './income-app.js';
import { IncomeApp } from './income-app.js';
import { IncomeDialog } from './income-dialog.js';
import { IncomeTable } from './income-table.js';
import { store } from '../../../shared/store/index.js';
import { addIncome, resetIncomes, selectIncomeItems } from '../store/income-slice.js';
import type { Income, IncomeStepConfig } from '../types.js';
import type { LionForm } from '@lion/ui/form.js';
import type { LionSelect } from '@lion/ui/select.js';
import { registerMockRoutes, worker } from '@web/mocks/browser.js';
import { http } from '@web/mocks/http.js';

const cardConfig: IncomeStepConfig = {
  availableSources: [{
    sourceId: '800+',
    label: 'Świadczenie rodzinne (karta)',
    fields: [{ name: 'childrenCount', label: 'Liczba dzieci', type: 'amount', required: true }],
    validations: { amount: { min: 800, max: 8000 }, childrenCount: { min: 1 } },
  }],
};

const loanConfig: IncomeStepConfig = {
  availableSources: [{
    sourceId: 'umowa_o_prace',
    label: 'Dochód z pracy (pożyczka)',
    fields: [
      { name: 'companyName', label: 'Pracodawca', type: 'input', required: true },
      { name: 'nip', label: 'NIP', type: 'input', required: true },
    ],
    validations: { amount: { min: 2000 }, nip: { minLength: 10, maxLength: 10 } },
  }],
};

const employmentIncome: Income = {
  id: 'employment-1',
  source: 'umowa_o_prace',
  amount: 5000,
  currency: 'EUR',
  durationDetails: { type: 'nieokreslony' },
  paymentMethod: ['przelew'],
  companyName: 'Acme',
  nip: '1234567890',
};

async function settle(element: IncomeApp | IncomeDialog | IncomeTable): Promise<void> {
  await element.updateComplete;
  await new Promise(resolve => setTimeout(resolve, 0));
  await element.updateComplete;
}

describe('Income Step product integration', () => {
  let app: IncomeApp;

  beforeEach(() => store.dispatch(resetIncomes()));
  afterEach(() => {
    app?.remove();
    worker.resetHandlers();
    store.dispatch(resetIncomes());
  });

  async function mount(config: IncomeStepConfig): Promise<IncomeTable> {
    app = document.createElement('income-app');
    app.config = config;
    document.body.appendChild(app);
    await settle(app);
    const table = app.shadowRoot!.querySelector<IncomeTable>('income-table')!;
    await settle(table);
    return table;
  }

  async function openAddDialog(source: string): Promise<IncomeDialog> {
    const dialog = app.shadowRoot!.querySelector<IncomeDialog>('income-dialog')!;
    await settle(dialog);
    dialog.shadowRoot!.querySelector<HTMLElement>('[slot="invoker"]')!.click();
    await settle(dialog);
    const select = dialog.shadowRoot!.querySelector<LionSelect>('[name="source"]')!;
    const nativeSelect = select.querySelector('select')!;
    nativeSelect.value = source;
    nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    await settle(dialog);
    return dialog;
  }

  async function fill(dialog: IncomeDialog, name: string, value: unknown): Promise<void> {
    const field = dialog.shadowRoot!.querySelector<HTMLElement & { modelValue: unknown }>(`[name="${name}"]`)!;
    field.modelValue = value;
    await settle(dialog);
  }

  async function save(dialog: IncomeDialog): Promise<void> {
    dialog.shadowRoot!.querySelector<HTMLElement>('.form-buttons [variant="primary"]')!.click();
    for (let attempt = 0; attempt < 100 && dialog.opened; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    expect(dialog.opened, 'successful save closes the dialog').to.be.false;
    await settle(app);
  }

  it('shows the injected product source label and saved currency in the mounted table', async () => {
    store.dispatch(addIncome(employmentIncome));
    const table = await mount(loanConfig);

    const cells = table.shadowRoot!.querySelectorAll('tbody td');
    expect(cells[0].textContent).to.equal('Dochód z pracy (pożyczka)');
    expect(cells[2].textContent).to.equal('5000 EUR');
  });

  it('renders the card configuration with benefit fields and no contract duration', async () => {
    await mount(cardConfig);
    const dialog = await openAddDialog('800+');

    const options = dialog.shadowRoot!.querySelectorAll('select option');
    expect(options[1].textContent).to.equal('Świadczenie rodzinne (karta)');
    expect(dialog.shadowRoot!.querySelector('[name="childrenCount"]')).to.exist;
    expect(dialog.shadowRoot!.querySelector('[name="companyName"]')).to.equal(null);
    expect(dialog.shadowRoot!.querySelector('[name="durationDetails"]')).to.equal(null);
  });

  it('submits the complete benefit model through Lion and HTTP into Redux', async () => {
    let posted: Income | undefined;
    registerMockRoutes(http.post('/api/income', async ({ request }) => {
      posted = await request.json();
      return Response.json({ ...posted, id: 'server-benefit' }, { status: 201 });
    }));
    await mount(cardConfig);
    const dialog = await openAddDialog('800+');
    await fill(dialog, 'childrenCount', 2);
    await fill(dialog, 'amount', 1600);
    await fill(dialog, 'paymentMethod', ['przelew']);
    const form = dialog.shadowRoot!.querySelector<LionForm>('lion-form')!;
    await form.registrationComplete;
    await save(dialog);

    expect(posted?.id).to.be.a('string').and.not.equal('');
    expect(selectIncomeItems(store.getState())).to.deep.equal([{
      id: 'server-benefit', source: '800+', amount: 1600, currency: 'PLN',
      durationDetails: { type: '' }, paymentMethod: ['przelew'], childrenCount: 2,
    }]);
  });

  it('preserves saved fields and identity when editing employment income through the form', async () => {
    const saved: Income = {
      ...employmentIncome, name: 'Imported income', sector: 'technology',
      durationDetails: { type: 'nieokreslony', durationInMonths: 24, durationInYears: 2 },
    };
    store.dispatch(addIncome(saved));
    let posted: Income | undefined;
    registerMockRoutes(http.post('/api/income', async ({ request }) => {
      posted = await request.json();
      return Response.json(posted);
    }));
    const table = await mount(loanConfig);
    const saves: Income[] = [];
    app.addEventListener('save', event => saves.push((event as CustomEvent<Income>).detail));
    const dialog = table.shadowRoot!.querySelector<IncomeDialog>('income-dialog')!;
    await settle(dialog);
    dialog.shadowRoot!.querySelector<HTMLElement>('[slot="invoker"]')!.click();
    await settle(dialog);
    await fill(dialog, 'amount', 6500);
    await save(dialog);

    expect(posted).to.deep.equal({ ...saved, amount: 6500 });
    expect(selectIncomeItems(store.getState())).to.deep.equal([{ ...saved, amount: 6500 }]);
    expect(saves).to.have.length(1);
  });

  it('renders employment fields and a contract duration for the loan configuration', async () => {
    await mount(loanConfig);
    const dialog = await openAddDialog('umowa_o_prace');

    expect(dialog.shadowRoot!.querySelector('[name="companyName"]')).to.exist;
    expect(dialog.shadowRoot!.querySelector('[name="nip"]')).to.exist;
    expect(dialog.shadowRoot!.querySelector('[name="childrenCount"]')).to.equal(null);
    expect(dialog.shadowRoot!.querySelector('[name="durationDetails"]')).to.exist;
  });

  it('uses the product minimum to reveal an incomplete income and block invalid submission', async () => {
    store.dispatch(addIncome({ ...employmentIncome, amount: 1500 }));
    let posted = false;
    registerMockRoutes(http.post('/api/income', () => {
      posted = true;
      return Response.json({});
    }));
    const table = await mount(loanConfig);
    expect(app.validateStep()).to.be.false;
    await settle(app);
    await settle(table);
    const dialog = table.shadowRoot!.querySelector<IncomeDialog>('income-dialog')!;
    await settle(dialog);
    expect(dialog.opened).to.be.true;
    expect(dialog.shadowRoot!.textContent).to.include('Ten dochód jest niekompletny');
    dialog.shadowRoot!.querySelector<HTMLElement>('.form-buttons [variant="primary"]')!.click();
    await settle(dialog);

    expect(posted).to.be.false;
    expect(selectIncomeItems(store.getState())[0].amount).to.equal(1500);
    expect(dialog.opened).to.be.true;
  });

  it('saves a new fixed-term employment income with every configured field and its end date', async () => {
    let posted: Income | undefined;
    registerMockRoutes(http.post('/api/income', async ({ request }) => {
      posted = await request.json();
      return Response.json({ ...posted, id: 'server-employment' }, { status: 201 });
    }));
    await mount(loanConfig);
    const dialog = await openAddDialog('umowa_o_prace');
    await fill(dialog, 'companyName', 'New employer');
    await fill(dialog, 'nip', '0987654321');
    await fill(dialog, 'amount', 4500);
    await fill(dialog, 'currency', 'USD');
    await fill(dialog, 'type', 'okreslony');
    await fill(dialog, 'endDate', new Date('2030-12-01T00:00:00.000Z'));
    await fill(dialog, 'paymentMethod', ['przelew', 'gotowka']);
    await save(dialog);

    expect(selectIncomeItems(store.getState())).to.deep.equal([{
      id: 'server-employment', source: 'umowa_o_prace', amount: 4500, currency: 'USD',
      companyName: 'New employer', nip: '0987654321',
      durationDetails: { type: 'okreslony', endDate: '2030-12-01T00:00:00.000Z' },
      paymentMethod: ['przelew', 'gotowka'],
    }]);
  });
});
