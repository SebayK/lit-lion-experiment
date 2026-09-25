import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { processContext } from '../context.js';
import type { ProcessController } from '../controllers/process-controller.js';

/**
 * A live summary component that subscribes directly to ProcessController.
 * Updates immediately when calculation values change in real-time.
 */
@customElement('process-live-summary')
export class ProcessLiveSummary extends LitElement {
  @consume({ context: processContext, subscribe: true })
  @state()
  private processCtrl?: ProcessController;

  private unsubscribe?: () => void;

  static styles = css`
    :host {
      display: block;
      margin-bottom: 1.5rem;
    }

    .live-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 0.875rem 1.25rem;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: #f8fafc;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      font-size: 0.95rem;
    }

    .item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .label {
      color: #94a3b8;
      font-weight: 500;
    }

    .value {
      color: #38bdf8;
      font-weight: 700;
      font-size: 1.05rem;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.65rem;
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 9999px;
      color: #38bdf8;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #38bdf8;
      box-shadow: 0 0 8px #38bdf8;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this._setupSubscription();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  protected updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('processCtrl')) {
      this._setupSubscription();
    }
  }

  private _setupSubscription(): void {
    this.unsubscribe?.();
    if (this.processCtrl) {
      this.unsubscribe = this.processCtrl.subscribe(this);
    }
  }

  render() {
    const calc = this.processCtrl?.calculationData;
    if (!calc || calc.loanAmount <= 0) {
      return html``;
    }

    return html`
      <div class="live-bar">
        <div class="item">
          <span class="badge">
            <span class="pulse-dot"></span> Live
          </span>
          <span class="label">Kwota:</span>
          <span class="value">${calc.loanAmount.toLocaleString('pl-PL')} zł</span>
        </div>

        <div class="item">
          <span class="label">Okres:</span>
          <span class="value">${calc.periodMonths} mies.</span>
        </div>

        <div class="item">
          <span class="label">Szacowana rata:</span>
          <span class="value">${calc.monthlyInstallment.toFixed(2)} zł/mc</span>
        </div>
      </div>
    `;
  }
}
