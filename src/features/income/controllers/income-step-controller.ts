import type { ReactiveControllerHost } from 'lit';
import { StoreController } from '../../../shared/store/StoreController.js';
import { store } from '../../../shared/store/index.js';
import { addIncome, updateIncome, deleteIncome, selectIncomeItems } from '../store/income-slice.js';
import { ValidationEngine } from '../domain/validation-engine.js';
import type { Income, IncomeStepConfig } from '../types.js';

/** The Income Step's store and domain boundary; views only supply configuration and events. */
export class IncomeStepController {
  private readonly storeController: StoreController;

  constructor(host: ReactiveControllerHost) {
    this.storeController = new StoreController(host);
  }

  get incomes(): Income[] {
    return selectIncomeItems(this.storeController.state);
  }

  firstIncomplete(config?: IncomeStepConfig): Income | undefined {
    return this.incomes.find(income => !ValidationEngine.isIncomeValid(income, config));
  }

  save(income: Income): void {
    const exists = this.incomes.some(item => item.id === income.id);
    store.dispatch(exists ? updateIncome(income) : addIncome(income));
  }

  delete(id: string): void {
    store.dispatch(deleteIncome(id));
  }
}
