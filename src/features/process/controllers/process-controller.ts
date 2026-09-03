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

  // Domain state
  calculationData: CalculationData | null = null;
  email: string | null = null;
  phone: string | null = null;

  // Step progression statuses
  stepStatuses: Record<ProcessStep, StepStatus> = {
    calculation: 'pending',
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
  }

  /**
   * Evaluates whether the user can access a given step based on completed prerequisites.
   */
  canAccess(step: ProcessStep): boolean {
    switch (step) {
      case 'calculation':
        return true;
      case 'email-verification':
        return this.calculationData !== null && this.stepStatuses.calculation === 'completed';
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
   * Completes the calculation step with the provided simulation data.
   */
  completeCalculation(data: CalculationData): void {
    this.calculationData = data;
    this.stepStatuses.calculation = 'completed';
    console.log(this)
    this.host.requestUpdate();
  }

  /**
   * Completes email verification.
   */
  completeEmailVerification(email: string): void {
    this.email = email;
    this.stepStatuses['email-verification'] = 'completed';
    this.host.requestUpdate();
  }

  /**
   * Completes phone verification.
   */
  completePhoneVerification(phone: string): void {
    this.phone = phone;
    this.stepStatuses['phone-verification'] = 'completed';
    this.host.requestUpdate();
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
      'email-verification': 'pending',
      'phone-verification': 'pending',
      dashboard: 'pending',
    };
    this.host.requestUpdate();
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
      'email-verification',
      'phone-verification',
      'dashboard',
    ];

    return stepOrder.find((step) => this.stepStatuses[step] === 'pending') || 'calculation';
  }
}
