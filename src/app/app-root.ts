import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Router } from '@lit-labs/router';

import './pages/home-page.js';
import './pages/about-page.js';
import './pages/not-found-page.js';
import { initMocks } from '../mocks/index.js';

// Rejestracja mocków HTTP (MSW Service Worker)
initMocks();

@customElement('app-root')
export class AppRoot extends LitElement {
  private _router = new Router(this, [
    { path: '/', render: () => html`<home-page></home-page>` },
    { path: '/about', render: () => html`<about-page></about-page>` },
    {
      path: '/process',
      enter: async () => {
        await import('../features/process/process-shell.js');
        return true;
      },
      render: () => html`<process-shell></process-shell>`,
    },
    {
      path: '/process/*',
      enter: async () => {
        await import('../features/process/process-shell.js');
        return true;
      },
      render: () => html`<process-shell></process-shell>`,
    },
    { path: '/*', render: () => html`<not-found-page></not-found-page>` },
  ]);

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background-color: #f8fafc;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      color: #0f172a;
    }

    .navbar {
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      padding: 0 2rem;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 700;
      font-size: 1.125rem;
      color: #1e293b;
      text-decoration: none;
    }

    .brand-icon {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.1rem;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .nav-link {
      text-decoration: none;
      color: #64748b;
      font-weight: 500;
      padding: 0.5rem 0.875rem;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .nav-link:hover {
      color: #1e293b;
      background: #f1f5f9;
    }

    .nav-link.active {
      color: #2563eb;
      background: #eff6ff;
      font-weight: 600;
    }

    .content-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
  `;

  private isRouteActive(basePath: string): boolean {
    const path = window.location.pathname;
    if (basePath === '/') return path === '/';
    return path.startsWith(basePath);
  }

  render() {
    return html`
      <header class="navbar">
        <a href="/" class="brand">
          <div class="brand-icon">🦁</div>
          <span>Lit Lion Experiment</span>
        </a>

        <nav>
          <ul class="nav-links">
            <li>
              <a href="/" class="nav-link ${this.isRouteActive('/') ? 'active' : ''}">Strona Główna</a>
            </li>
            <li>
              <a href="/about" class="nav-link ${this.isRouteActive('/about') ? 'active' : ''}">O nas</a>
            </li>
            <li>
              <a href="/process" class="nav-link ${this.isRouteActive('/process') ? 'active' : ''}">Proces</a>
            </li>
          </ul>
        </nav>
      </header>

      <main class="content-container">
        ${this._router.outlet()}
      </main>
    `;
  }
}
