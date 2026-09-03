import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('not-found-page')
export class NotFoundPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 4rem 2rem;
      text-align: center;
    }

    .container {
      max-width: 500px;
      margin: 0 auto;
      background: #ffffff;
      padding: 3rem;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }

    h1 {
      font-size: 4rem;
      margin: 0;
      color: #ef4444;
    }

    h2 {
      margin: 0.5rem 0 1rem 0;
      color: #1e293b;
    }

    p {
      color: #64748b;
      margin-bottom: 2rem;
    }

    .btn {
      display: inline-block;
      background: #2563eb;
      color: white;
      text-decoration: none;
      padding: 0.625rem 1.25rem;
      border-radius: 8px;
      font-weight: 500;
    }
  `;

  render() {
    return html`
      <div class="container">
        <h1>404</h1>
        <h2>Strona nie została znaleziona</h2>
        <p>Przepraszamy, szukana podstrona nie istnieje lub została przeniesiona.</p>
        <a href="/" class="btn">Powrót do strony głównej</a>
      </div>
    `;
  }
}
