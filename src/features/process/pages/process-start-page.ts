import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

/**
 * Process start page that immediately redirects to the calculation step.
 * According to ADR 0003, the calculation step is now the true entry point
 * of the application process, so this page serves only as a redirect handler.
 */
@customElement("process-start-page")
export class ProcessStartPage extends LitElement {
  connectedCallback() {
    super.connectedCallback();
    
    // Immediately redirect to calculation step - this is the entry point
    this.dispatchEvent(
      new CustomEvent("request-navigate", {
        detail: "/calculation",
        bubbles: true,
        composed: true,
      })
    );
  }

  render() {
    // Empty render as component redirects immediately
    return html``;
  }
}
