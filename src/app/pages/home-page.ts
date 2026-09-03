import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('home-page')
export class HomePage extends LitElement {
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

    .hero {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: #f8fafc;
      padding: 3rem 2rem;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }

    h1 {
      margin: 0 0 1rem 0;
      font-size: 2.25rem;
      font-weight: 700;
      background: linear-gradient(90deg, #38bdf8, #818cf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    p {
      color: #94a3b8;
      font-size: 1.125rem;
      line-height: 1.6;
      max-width: 600px;
      margin-bottom: 2rem;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .card {
      background: #ffffff;
      border-radius: 12px;
      padding: 1.5rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      transition: all 0.2s ease-in-out;
    }

    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.08);
      border-color: #cbd5e1;
    }

    .card h2 {
      font-size: 1.25rem;
      color: #1e293b;
      margin-top: 0;
    }

    .card p {
      font-size: 0.95rem;
      color: #64748b;
      margin-bottom: 1.25rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #2563eb;
      color: white;
      text-decoration: none;
      padding: 0.625rem 1.25rem;
      border-radius: 8px;
      font-weight: 500;
      transition: background 0.2s ease;
    }

    .btn:hover {
      background: #1d4ed8;
    }
  `;

  render() {
    return html`
      <div class="hero">
        <h1>Strona Główna</h1>
        <p>Witaj w aplikacji testowej Lit + Lion + Redux Toolkit z nowym routerem <code>@lit-labs/router</code>.</p>
        <a href="/process" class="btn">
          Rozpocznij proces wnioskowania &rarr;
        </a>
      </div>

      <div class="cards-grid">
        <div class="card">
          <h2>Root Router</h2>
          <p>Nawigacja na najwyższym poziomie obsługuje Stronę Główną, sekcję O nas oraz całą ścieżkę Procesu.</p>
        </div>
        <div class="card">
          <h2>Zagnieżdżony Router</h2>
          <p>Podścieżka <code>/process/*</code> posiada własny, autonomiczny kontroler routingu zarządzający krokami.</p>
        </div>
        <div class="card">
          <h2>Formularze & Redux</h2>
          <p>Komponenty formularzy wykorzystują współdzielony stan Redux Toolkit oraz walidacje Lion.js.</p>
        </div>
      </div>
    `;
  }
}
