import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Router } from '@lit-labs/router';
import { AppAppearance } from './layout/app-appearance.js';
import './layout/app-layout.js';

import './pages/home-page.js';
import './pages/about-page.js';
import './pages/not-found-page.js';
import { initMocks } from '../mocks/index.js';
import '../features/calculation/store/calculation-slice.js';
import '../features/client-profile/store/client-profile-slice.js';
import '../features/income/store/income-slice.js';

// Rejestracja mocków HTTP (MSW Service Worker)
initMocks();

@customElement('app-root')
export class AppRoot extends LitElement {
  @property({ type: String, reflect: true })
  appearance: AppAppearance = AppAppearance.Standard;

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
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      color: #0f172a;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 700;
      font-size: 1.125rem;
      color: var(--app-topbar-foreground);
      text-decoration: none;
    }

    .brand-icon {
      width: 32px;
      height: 32px;
      background: var(--app-navigation-active);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }

    .nav-links {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.375rem;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    .nav-link {
      text-decoration: none;
      display: inline-block;
      color: var(--app-topbar-foreground);
      font-weight: 500;
      padding: 0.5rem 0.875rem;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .nav-link:hover {
      background: var(--app-navigation-hover);
    }

    .nav-link.active {
      color: var(--app-topbar-accent);
      background: var(--app-navigation-active);
      font-weight: 600;
    }

    .brand:focus-visible, .nav-link:focus-visible {
      outline: 2px solid var(--app-topbar-accent);
      outline-offset: 3px;
    }

    @media (max-width: 640px) {
      .nav-links {
        justify-content: space-between;
      }

      .nav-link {
        font-size: 0.875rem;
        padding: 0.5rem 0.625rem;
      }
    }
  `;

  private isRouteActive(basePath: string): boolean {
    const path = window.location.pathname;
    if (basePath === '/') return path === '/';
    return path.startsWith(basePath);
  }

  render() {
    return html`
      <app-layout .appearance=${this.appearance}>
        <a href="/" class="brand" slot="brand">
          <div class="brand-icon">🦁</div>
          <span>Lit Lion Experiment</span>
        </a>

        <nav slot="navigation" aria-label="Nawigacja główna">
          <ul class="nav-links">
            <li>
              <a href="/" aria-current=${this.isRouteActive('/') ? 'page' : nothing} class="nav-link ${this.isRouteActive('/') ? 'active' : ''}">Strona Główna</a>
            </li>
            <li>
              <a href="/about" aria-current=${this.isRouteActive('/about') ? 'page' : nothing} class="nav-link ${this.isRouteActive('/about') ? 'active' : ''}">O nas</a>
            </li>
            <li>
              <a href="/process" aria-current=${this.isRouteActive('/process') ? 'page' : nothing} class="nav-link ${this.isRouteActive('/process') ? 'active' : ''}">Proces</a>
            </li>
          </ul>
        </nav>
        ${this._router.outlet()}
      </app-layout>
    `;
  }
}
