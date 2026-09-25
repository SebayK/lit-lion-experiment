import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { CalculationData, ProcessStep, StepStatus } from '../types.js';

export interface ProcessControllerOptions {
  onNavigate?: (step: ProcessStep) => void;
}

/**
 * ReactiveController managing the Application Process state, step transitions,
 * and navigation guards.
 */
export class ProcessController implements ReactiveController {
  private readonly host: ReactiveControllerHost;
  private readonly options?: ProcessControllerOptions;
  private readonly subscribers = new Set<ReactiveControllerHost>();

  // Domain state
  calculationData: CalculationData | null = null;
  email: string | null = null;
  phone: string | null = null;

  // Step progression statuses
  stepStatuses: Record<ProcessStep, StepStatus> = {
    calculation: 'pending',
    income: 'pending',
    'email-verification': 'pending',
    'phone-verification': 'pending',
    dashboard: 'pending',
  };

  constructor(host: ReactiveControllerHost, options?: ProcessControllerOptions) {
    this.host = host;
    this.options = options;
    host.addController(this);
    console.log('🎯 [ProcessController] constructor', {
      host: host.constructor.name,
      stepStatuses: this.stepStatuses,
      calculationData: this.calculationData,
    });
  }

  hostConnected(): void {
    console.log('🎯 [ProcessController] hostConnected');
    // In-memory state lifespan: initialized with host
  }

  hostDisconnected(): void {
    console.log('🎯 [ProcessController] hostDisconnected');
    // Clean-up if needed
    this.subscribers.clear();
  }

  /**
   * Subscribes a ReactiveControllerHost (e.g. child component) to receive requestUpdate()
   * whenever ProcessController state changes live.
   * Returns an unsubscribe function.
   */
  subscribe(subscriber: ReactiveControllerHost): () => void {
    this.subscribers.add(subscriber);
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  /**
   * Notifies the primary host (ProcessShell) and all registered subscribers of state updates.
   */
  private _notify(): void {
    this.host.requestUpdate();
    for (const subscriber of this.subscribers) {
      subscriber.requestUpdate();
    }
  }

  /**
   * Evaluates whether the user can access a given step based on completed prerequisites.
   */
  canAccess(step: ProcessStep): boolean {
    switch (step) {
      case 'calculation':
        return true;
      case 'income':
        return this.calculationData !== null && this.stepStatuses.calculation === 'completed';
      case 'email-verification':
        return (
          this.canAccess('income') &&
          this.stepStatuses.income === 'completed'
        );
      case 'phone-verification':
        return (
          this.canAccess('email-verification') &&
          this.stepStatuses['email-verification'] === 'completed'
        );
      case 'dashboard':
        return (
          this.canAccess('phone-verification') &&
          this.stepStatuses['phone-verification'] === 'completed'
        );
      default:
        return false;
    }
  }

  /**
   * Updates calculation parameters live in draft mode without completing the step.
   * Triggers re-renders on ProcessShell and any subscribed components.
   */
  updateCalculation(data: Partial<CalculationData>): void {
    this.calculationData = {
      ...(this.calculationData ?? { loanAmount: 0, periodMonths: 0, monthlyInstallment: 0 }),
      ...data,
    };
    this._notify();
  }

  /**
   * Completes the calculation step with the provided simulation data.
   */
  completeCalculation(data: CalculationData): void {
    this.calculationData = data;
    this.stepStatuses.calculation = 'completed';
    this._notify();
  }

  /**
   * Completes the income step.
   */
  completeIncome(): void {
    this.stepStatuses.income = 'completed';
    this._notify();
  }

  /**
   * Completes email verification.
   */
  completeEmailVerification(email: string): void {
    this.email = email;
    this.stepStatuses['email-verification'] = 'completed';
    this._notify();
  }

  /**
   * Completes phone verification.
   */
  completePhoneVerification(phone: string): void {
    this.phone = phone;
    this.stepStatuses['phone-verification'] = 'completed';
    this._notify();
  }

  /**
   * Resets the entire process back to initial blank state.
   */
  reset(): void {
    this.calculationData = null;
    this.email = null;
    this.phone = null;
    this.stepStatuses = {
      calculation: 'pending',
      income: 'pending',
      'email-verification': 'pending',
      'phone-verification': 'pending',
      dashboard: 'pending',
    };
    this._notify();
  }

  /**
   * Returns the first step that is not yet completed.
   * Used for redirect logic when route guards block access to a step that
   * requires uncompleted prerequisites. Iterates through steps in sequential
   * order and returns the first with 'pending' status, or 'calculation' as fallback.
   */
  getFirstUncompletedStep(): ProcessStep {
    const stepOrder: ProcessStep[] = [
      'calculation',
      'income',
      'email-verification',
      'phone-verification',
      'dashboard',
    ];

    return stepOrder.find((step) => this.stepStatuses[step] === 'pending') || 'calculation';
  }
}
