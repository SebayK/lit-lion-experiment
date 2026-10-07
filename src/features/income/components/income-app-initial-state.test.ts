import '@webcomponents/scoped-custom-element-registry';
import { expect } from '@esm-bundle/chai';
import './income-app.js';
import type { IncomeApp } from './income-app.js';
import type { IncomeTable } from './income-table.js';

describe('Income Step with a lazily registered store', () => {
  it('renders and validates before any action initializes the income slice', async () => {
    const app: IncomeApp = document.createElement('income-app');
    app.config = { availableSources: [] };
    document.body.appendChild(app);
    try {
      await app.updateComplete;
      const table = app.shadowRoot!.querySelector<IncomeTable>('income-table')!;
      await table.updateComplete;

      expect(table.shadowRoot!.textContent).to.include('Brak dochodów');
      expect(app.validateStep()).to.be.true;
    } finally {
      app.remove();
    }
  });
});
