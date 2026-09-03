import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { provide } from "@lit/context";
import { Routes } from "@lit-labs/router";
import { ProcessController } from "./controllers/process-controller.js";
import { processContext } from "./context.js";
import type { ProcessStep } from "./types.js";

@customElement("process-shell")
export class ProcessShell extends LitElement {
  @provide({ context: processContext })
  private processCtrl = new ProcessController(this);

  // Notification state
  @state()
  private notificationVisible = false;

  @state()
  private notificationMessage = '';

  private notificationTimeout?: number;

  // Step labels map for Polish translations
  private readonly STEP_LABELS: Record<ProcessStep, string> = {
    'calculation': 'Kalkulacja',
    'email-verification': 'Weryfikacja Email',
    'phone-verification': 'Weryfikacja Telefonu',
    'dashboard': 'Panel'
  };

  constructor() {
    super();
    console.log('🎯 [ProcessShell] constructor - Creating ProcessController');
  }

  hostConnected() {
    console.group('🎯 [ProcessShell] Connected');
    console.log('ProcessController:', this.processCtrl);
    console.log('Context token:', processContext);
    console.groupEnd();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Clean up notification timeout to prevent memory leaks
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
  }

  public routes = new Routes(this, [
    // Start page - entry point
    {
      path: "",
      enter: async () => {
        await import("./pages/process-start-page.js");
        return true;
      },
      render: () => html`<process-start-page></process-start-page>`,
    },
    {
      path: "/",
      enter: async () => {
        await import("./pages/process-start-page.js");
        return true;
      },
      render: () => html`<process-start-page></process-start-page>`,
    },

    // Calculation step - always accessible (no guard)
    {
      path: "calculation",
      enter: async () => {
        await import("./pages/calculation-step-page.js");
        // No guard: calculation is always accessible
        return true;
      },
      render: () => html`<calculation-step-page></calculation-step-page>`,
    },
    {
      path: "/calculation",
      enter: async () => {
        await import("./pages/calculation-step-page.js");
        // No guard: calculation is always accessible
        return true;
      },
      render: () => html`<calculation-step-page></calculation-step-page>`,
    },

    // Email verification step - with guard
    {
      path: "email-verification",
      enter: async () => {
        await import("./pages/email-verification-step-page.js");
        
        try {
          if (!this.processCtrl.canAccess('email-verification')) {
            const redirectTo = this.processCtrl.getFirstUncompletedStep();
            this._showRedirectNotification(redirectTo);
            this.routes.goto(`/process/${redirectTo}`);
            return false;
          }
        } catch (error) {
          console.error('[RouteGuard] Error checking access:', error);
          this._showRedirectNotification('calculation');
          this.routes.goto('/process/calculation');
          return false;
        }
        
        return true;
      },
      render: () => html`<email-verification-step-page></email-verification-step-page>`,
    },
    {
      path: "/email-verification",
      enter: async () => {
        await import("./pages/email-verification-step-page.js");
        
        try {
          if (!this.processCtrl.canAccess('email-verification')) {
            const redirectTo = this.processCtrl.getFirstUncompletedStep();
            this._showRedirectNotification(redirectTo);
            this.routes.goto(`/process/${redirectTo}`);
            return false;
          }
        } catch (error) {
          console.error('[RouteGuard] Error checking access:', error);
          this._showRedirectNotification('calculation');
          this.routes.goto('/process/calculation');
          return false;
        }
        
        return true;
      },
      render: () => html`<email-verification-step-page></email-verification-step-page>`,
    },

    // Phone verification step - with guard
    {
      path: "phone-verification",
      enter: async () => {
        await import("./pages/phone-verification-step-page.js");
        
        try {
          if (!this.processCtrl.canAccess('phone-verification')) {
            const redirectTo = this.processCtrl.getFirstUncompletedStep();
            this._showRedirectNotification(redirectTo);
            this.routes.goto(`/process/${redirectTo}`);
            return false;
          }
        } catch (error) {
          console.error('[RouteGuard] Error checking access:', error);
          this._showRedirectNotification('calculation');
          this.routes.goto('/process/calculation');
          return false;
        }
        
        return true;
      },
      render: () => html`<phone-verification-step-page></phone-verification-step-page>`,
    },
    {
      path: "/phone-verification",
      enter: async () => {
        await import("./pages/phone-verification-step-page.js");
        
        try {
          if (!this.processCtrl.canAccess('phone-verification')) {
            const redirectTo = this.processCtrl.getFirstUncompletedStep();
            this._showRedirectNotification(redirectTo);
            this.routes.goto(`/process/${redirectTo}`);
            return false;
          }
        } catch (error) {
          console.error('[RouteGuard] Error checking access:', error);
          this._showRedirectNotification('calculation');
          this.routes.goto('/process/calculation');
          return false;
        }
        
        return true;
      },
      render: () => html`<phone-verification-step-page></phone-verification-step-page>`,
    },

    // Dashboard step - with guard
    {
      path: "dashboard",
      enter: async () => {
        await import("./pages/dashboard-step-page.js");
        
        try {
          if (!this.processCtrl.canAccess('dashboard')) {
            const redirectTo = this.processCtrl.getFirstUncompletedStep();
            this._showRedirectNotification(redirectTo);
            this.routes.goto(`/process/${redirectTo}`);
            return false;
          }
        } catch (error) {
          console.error('[RouteGuard] Error checking access:', error);
          this._showRedirectNotification('calculation');
          this.routes.goto('/process/calculation');
          return false;
        }
        
        return true;
      },
      render: () => html`<dashboard-step-page></dashboard-step-page>`,
    },
    {
      path: "/dashboard",
      enter: async () => {
        await import("./pages/dashboard-step-page.js");
        
        try {
          if (!this.processCtrl.canAccess('dashboard')) {
            const redirectTo = this.processCtrl.getFirstUncompletedStep();
            this._showRedirectNotification(redirectTo);
            this.routes.goto(`/process/${redirectTo}`);
            return false;
          }
        } catch (error) {
          console.error('[RouteGuard] Error checking access:', error);
          this._showRedirectNotification('calculation');
          this.routes.goto('/process/calculation');
          return false;
        }
        
        return true;
      },
      render: () => html`<dashboard-step-page></dashboard-step-page>`,
    },

    // Backward compatibility redirects
    {
      path: "income",
      enter: async () => {
        // Redirect old route to new calculation route
        this.routes.goto("/process/calculation");
        return false;
      },
      render: () => html``,
    },
    {
      path: "/income",
      enter: async () => {
        // Redirect old route to new calculation route
        this.routes.goto("/process/calculation");
        return false;
      },
      render: () => html``,
    },
    {
      path: "summary",
      enter: async () => {
        // Redirect old route to dashboard
        this.routes.goto("/process/dashboard");
        return false;
      },
      render: () => html``,
    },
    {
      path: "/summary",
      enter: async () => {
        // Redirect old route to dashboard
        this.routes.goto("/process/dashboard");
        return false;
      },
      render: () => html``,
    },

    // Fallback - unknown routes
    {
      path: "/*",
      enter: async () => {
        await import("./pages/process-start-page.js");
        return true;
      },
      render: () => html`<process-start-page></process-start-page>`,
    },
  ]);

  public goto(pathname: string) {
    window.history.pushState({}, "", pathname);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  /**
   * Shows a notification to the user when they are redirected due to missing prerequisites.
   * The notification auto-dismisses after 3 seconds.
   */
  private _showRedirectNotification(targetStep: ProcessStep): void {
    this.notificationMessage = `Aby kontynuować, najpierw ukończ krok: ${this.STEP_LABELS[targetStep]}`;
    this.notificationVisible = true;

    // Clear existing timeout if present
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }

    // Auto-dismiss after 3 seconds
    this.notificationTimeout = window.setTimeout(() => {
      this.notificationVisible = false;
      this.requestUpdate();
    }, 3000);
  }

  /**
   * Manually dismisses the notification and clears the timeout.
   */
  private _dismissNotification(): void {
    if (this.notificationTimeout) {
      clearTimeout(this.notificationTimeout);
    }
    this.notificationVisible = false;
  }

  static styles = css`
    :host {
      display: block;
      padding: 1.5rem;
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(6px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .process-container {
      max-width: 960px;
      margin: 0 auto;
    }

    /* Notification banner styles */
    .notification-banner {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
      background: #fffbeb;
      border: 1px solid #fbbf24;
      border-radius: 8px;
      color: #92400e;
      font-weight: 500;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .notification-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .notification-icon {
      font-size: 1.25rem;
    }

    .notification-dismiss {
      background: transparent;
      border: none;
      color: #92400e;
      cursor: pointer;
      font-size: 1.25rem;
      padding: 0.25rem;
      line-height: 1;
      opacity: 0.7;
      transition: opacity 0.2s;
    }

    .notification-dismiss:hover {
      opacity: 1;
    }

    .stepper {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 2.5rem;
      padding: 1.25rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .step-item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      text-decoration: none;
      color: #64748b;
      font-weight: 500;
      font-size: 0.95rem;
      transition: color 0.2s ease;
    }

    .step-item.disabled {
      color: #cbd5e1;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .step-item.completed {
      color: #166534;
    }

    .step-badge {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #f1f5f9;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.875rem;
      border: 1px solid #cbd5e1;
      transition: all 0.2s ease;
    }

    .step-item.disabled .step-badge {
      background: #f8fafc;
      color: #cbd5e1;
      border-color: #e2e8f0;
    }

    .step-item.completed .step-badge {
      background: #dcfce7;
      color: #166534;
      border-color: #86efac;
    }

    .step-item.active {
      color: #2563eb;
      font-weight: 700;
    }

    .step-item.active .step-badge {
      background: #2563eb;
      color: #ffffff;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
    }

    .step-divider {
      width: 40px;
      height: 2px;
      background: #e2e8f0;
    }
  `;

  private getActiveStep(): ProcessStep | "start" {
    const path = window.location.pathname;
    if (path.includes("/process/calculation")) return "calculation";
    if (path.includes("/process/email-verification")) return "email-verification";
    if (path.includes("/process/phone-verification")) return "phone-verification";
    if (path.includes("/process/dashboard")) return "dashboard";
    return "start";
  }

  private _renderStepItem(step: ProcessStep, index: number, label: string) {
    const activeStep = this.getActiveStep();
    const isActive = activeStep === step;
    const isAccessible = this.processCtrl.canAccess(step);
    const isCompleted = this.processCtrl.stepStatuses[step] === 'completed';

    if (!isAccessible) {
      return html`
        <div 
          class="step-item disabled"
          title="Ukończ poprzednie kroki aby odblokować"
        >
          <span class="step-badge">${index + 1}</span>
          <span>${label}</span>
        </div>
      `;
    }

    return html`
      <a
        href="/process/${step}"
        class="step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}"
      >
        <span class="step-badge">${index + 1}</span>
        <span>${label}</span>
      </a>
    `;
  }

  render() {
    return html`
      <div class="process-container">
        <!-- Notification Banner -->
        ${this.notificationVisible
          ? html`
              <div class="notification-banner" role="alert">
                <div class="notification-content">
                  <span class="notification-icon">⚠️</span>
                  <span>${this.notificationMessage}</span>
                </div>
                <button
                  class="notification-dismiss"
                  @click=${this._dismissNotification}
                  aria-label="Zamknij powiadomienie"
                >
                  ×
                </button>
              </div>
            `
          : ''}

        <!-- Stepper indicator -->
        <nav class="stepper" aria-label="Kroki procesu">
          ${this._renderStepItem('calculation', 0, 'Kalkulacja')}
          <div class="step-divider"></div>
          ${this._renderStepItem('email-verification', 1, 'Email')}
          <div class="step-divider"></div>
          ${this._renderStepItem('phone-verification', 2, 'Telefon')}
          <div class="step-divider"></div>
          ${this._renderStepItem('dashboard', 3, 'Panel')}
        </nav>

        <!-- Nested Router Outlet -->
        <main @request-navigate=${(e: CustomEvent<string>) => this.routes.goto(e.detail)}>
          ${this.routes.outlet()}
        </main>
      </div>
    `;
  }
}
