import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { AppAppearance, getAppearancePreset } from './app-appearance.js';

/** Application-wide surface with brand/navigation slots and a default content slot. */
@customElement('app-layout')
export class AppLayout extends LitElement {
  @property({ type: String, reflect: true })
  appearance: AppAppearance = AppAppearance.Standard;

  static styles = css`
    :host {
      display: block;
    }

    .layout {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      min-height: 100svh;
      background: var(--app-page-background);
      color: #1e293b;
      --app-page-padding: 0;
      --app-content-gutter: 1rem;
      --app-content-radius: 28px;
      --app-content-inset: max(var(--app-content-gutter), calc((100% - 1200px) / 2));
    }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 50;
      flex-shrink: 0;
      padding: calc(1rem + env(safe-area-inset-top, 0px)) max(1rem, env(safe-area-inset-right, 0px)) 1rem max(1rem, env(safe-area-inset-left, 0px));
      color: var(--app-topbar-foreground);
    }

    /* One background paints the header and its inverse corners as a continuous gradient. */
    .topbar::before {
      content: '';
      position: absolute;
      inset: 0 0 calc(-1 * var(--app-content-radius));
      z-index: -1;
      pointer-events: none;
      background: var(--app-topbar-background);
      mask:
        linear-gradient(#000 0 0) top / 100% calc(100% - var(--app-content-radius)) no-repeat,
        radial-gradient(circle at bottom right, transparent calc(var(--app-content-radius) - 0.5px), #000 var(--app-content-radius)) bottom left / calc(var(--app-content-inset) + var(--app-content-radius)) var(--app-content-radius) no-repeat,
        radial-gradient(circle at bottom left, transparent calc(var(--app-content-radius) - 0.5px), #000 var(--app-content-radius)) bottom right / calc(var(--app-content-inset) + var(--app-content-radius)) var(--app-content-radius) no-repeat;
    }

    .topbar-inner {
      max-width: 1136px;
      min-height: 40px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    slot[name='brand'], slot[name='navigation'] {
      display: block;
      min-width: 0;
    }

    .content-surface {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      background: var(--app-topbar-background);
      padding-bottom: max(1rem, env(safe-area-inset-bottom, 0px));
    }

    .content-inner {
      box-sizing: border-box;
      flex-grow: 1;
      width: min(1200px, calc(100% - var(--app-content-gutter) * 2));
      margin: 0 auto;
      padding: clamp(1rem, 3vw, 2rem);
      background: #ffffff;
    }

    @media (max-width: 640px) {
      .layout {
        --app-content-gutter: 0.5rem;
        --app-content-radius: 24px;
      }

      .topbar-inner {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
      }
    }
  `;

  render() {
    const preset = getAppearancePreset(this.appearance);

    return html`
      <div class="layout" style=${styleMap({
        '--app-page-background': preset.pageBackground,
        '--app-topbar-background': preset.topbarBackground,
        '--app-topbar-foreground': preset.foreground,
        '--app-topbar-accent': preset.accent,
        '--app-navigation-hover': preset.navigationHover,
        '--app-navigation-active': preset.navigationActive,
      })}>
        <header class="topbar">
          <div class="topbar-inner">
            <slot name="brand"></slot>
            <slot name="navigation"></slot>
          </div>
        </header>

        <main class="content-surface">
          <div class="content-inner">
            <slot></slot>
          </div>
        </main>
      </div>
    `;
  }
}
