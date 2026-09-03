import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('about-page')
export class AboutPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 2rem;
      animation: fadeIn 0.3s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 2.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      max-width: 800px;
    }

    h1 {
      margin-top: 0;
      color: #0f172a;
      font-size: 2rem;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 0.75rem;
    }

    p {
      color: #475569;
      line-height: 1.7;
      font-size: 1.05rem;
    }

    .tech-stack {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    .badge {
      background: #eff6ff;
      color: #2563eb;
      border: 1px solid #bfdbfe;
      padding: 0.375rem 0.875rem;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 0.875rem;
    }
  `;

  render() {
    return html`
      <div class="container">
        <h1>O Projekcie</h1>
        <p>
          Niniejsza aplikacja demonstracyjna prezentuje pełne wykorzystanie biblioteki <strong>@lit-labs/router</strong>
          do zarządzania wielopoziomowym routingiem w Web Components built with Lit.
        </p>
        <p>
          Architektura została zaprojektowana z podziałem na moduły oraz zagnieżdżone kontrolery routingu (Nested Routing),
          dzięki czemu każdy proces (np. proces wnioskowania o produkt finansowy) zachowuje pełne odizolowanie i własne kroki.
        </p>

        <h3>Użyte technologie:</h3>
        <div class="tech-stack">
          <span class="badge">Lit 3</span>
          <span class="badge">@lit-labs/router</span>
          <span class="badge">Lion UI</span>
          <span class="badge">Redux Toolkit</span>
          <span class="badge">TypeScript</span>
        </div>
      </div>
    `;
  }
}
