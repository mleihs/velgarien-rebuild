import { localized, msg } from '@lit/localize';
import { css, html, LitElement, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { appState } from '../../services/AppStateManager.js';
import { icons } from '../../utils/icons.js';

interface NavTab {
  label: string;
  path: string;
  icon: () => TemplateResult;
  requireAdmin?: boolean;
}

function getTabs(): NavTab[] {
  return [
    { label: msg('Lore'), path: 'lore', icon: () => icons.book(14) },
    { label: msg('Agents'), path: 'agents', icon: () => icons.users(14) },
    { label: msg('Buildings'), path: 'buildings', icon: () => icons.building(14) },
    { label: msg('Events'), path: 'events', icon: () => icons.bolt(14) },
    { label: msg('Chat'), path: 'chat', icon: () => icons.messageCircle(14) },
    { label: msg('Social'), path: 'social', icon: () => icons.megaphone(14) },
    { label: msg('Locations'), path: 'locations', icon: () => icons.mapPin(14) },
    { label: msg('Settings'), path: 'settings', icon: () => icons.gear(14), requireAdmin: true },
  ];
}

@localized()
@customElement('velg-simulation-nav')
export class VelgSimulationNav extends LitElement {
  static styles = css`
    :host {
      display: block;
      background: var(--color-surface);
      border-bottom: var(--border-default);
    }

    .nav {
      display: flex;
      align-items: stretch;
      gap: 0;
      padding: 0 var(--space-6);
      overflow-x: auto;
    }

    /* Hide scrollbar but keep scrollability */
    .nav::-webkit-scrollbar {
      display: none;
    }
    .nav {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    .nav__tab {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      font-family: var(--font-brutalist);
      font-weight: var(--font-bold);
      font-size: var(--text-sm);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      color: var(--color-text-muted);
      background: transparent;
      border: none;
      border-bottom: 3px solid transparent;
      cursor: pointer;
      white-space: nowrap;
      text-decoration: none;
      overflow: hidden;
      transition:
        color 0.25s ease,
        letter-spacing 0.3s ease,
        text-shadow 0.3s ease,
        transform 0.25s ease;

      /* Staggered entrance */
      opacity: 0;
      transform: translateY(6px);
      animation: nav-enter 0.35s ease forwards;
    }

    /* --- Icon --- */

    .nav__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      flex-shrink: 0;
    }

    .nav__icon svg {
      display: block;
    }

    /* --- Flowing diagonal gradient (::before) — appears on sustained hover --- */

    .nav__tab::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--color-primary) 12%, transparent),
        color-mix(in srgb, var(--color-text-secondary) 8%, transparent),
        color-mix(in srgb, var(--color-primary) 15%, transparent),
        color-mix(in srgb, var(--color-text-secondary) 8%, transparent),
        color-mix(in srgb, var(--color-primary) 12%, transparent)
      );
      background-size: 300% 300%;
      opacity: 0;
      transition: opacity 0.4s ease 0.3s;
      pointer-events: none;
      z-index: 0;
    }

    .nav__tab:hover::before {
      opacity: 1;
      animation: nav-gradient-flow 3s linear infinite;
    }

    .nav__tab .nav__icon,
    .nav__tab .nav__label {
      position: relative;
      z-index: 1;
    }

    /* --- Underline bar (::after) --- */

    .nav__tab::after {
      content: '';
      position: absolute;
      bottom: -3px;
      left: 50%;
      width: 0;
      height: 3px;
      background: var(--color-primary);
      transition: width 0.15s ease, left 0.15s ease;
      z-index: 1;
    }

    .nav__tab:hover::after {
      left: 0;
      width: 100%;
    }

    /* --- Hover state — hard/sharp, gradient fills on dwell --- */

    .nav__tab:hover {
      color: var(--color-primary);
      background: color-mix(in srgb, var(--color-primary) 8%, transparent);
    }

    .nav__tab:hover .nav__icon {
      transform: translateY(-4px) rotate(-12deg) scale(1.3);
    }

    /* --- Active state --- */

    .nav__tab--active {
      color: var(--color-primary);
      background: color-mix(in srgb, var(--color-primary) 10%, transparent);
    }

    .nav__tab--active::after {
      left: 0;
      width: 100%;
      background: var(--color-primary);
    }

    .nav__tab--active .nav__icon {
      animation: nav-icon-float 2.5s ease-in-out infinite;
    }

    /* Active + hover = extra kick */
    .nav__tab--active:hover {
      background: color-mix(in srgb, var(--color-primary) 15%, transparent);
    }

    .nav__tab--active:hover .nav__icon {
      animation: none;
      transform: translateY(-4px) rotate(-12deg) scale(1.3);
    }

    /* --- Keyframes --- */

    @keyframes nav-enter {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Diagonal gradient flow — same pattern as embassy cards */
    @keyframes nav-gradient-flow {
      0% { background-position: 0% 0%; }
      100% { background-position: 100% 100%; }
    }

    /* Active icon float: gentle bob + rotate */
    @keyframes nav-icon-float {
      0%, 100% {
        transform: translateY(0) rotate(0deg) scale(1);
      }
      25% {
        transform: translateY(-2px) rotate(-3deg) scale(1.05);
      }
      75% {
        transform: translateY(1px) rotate(2deg) scale(0.98);
      }
    }
  `;

  @property({ type: String }) simulationId = '';
  @state() private _activeTab = 'lore';

  connectedCallback(): void {
    super.connectedCallback();
    this._detectActiveTab();
  }

  private _detectActiveTab(): void {
    const path = window.location.pathname;
    const tab = getTabs().find((t) => path.includes(`/${t.path}`));
    if (tab) {
      this._activeTab = tab.path;
    }
  }

  private get _slug(): string {
    return appState.currentSimulation.value?.slug ?? this.simulationId;
  }

  private _handleTabClick(e: Event, tab: NavTab): void {
    e.preventDefault();
    this._activeTab = tab.path;
    this.dispatchEvent(
      new CustomEvent('navigate', {
        detail: `/simulations/${this._slug}/${tab.path}`,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private get _visibleTabs(): NavTab[] {
    return getTabs().filter((tab) => {
      if (tab.requireAdmin && !appState.canAdmin.value) return false;
      return true;
    });
  }

  protected render() {
    return html`
      <nav class="nav">
        ${this._visibleTabs.map(
          (tab, i) => html`
            <a
              href="/simulations/${this._slug}/${tab.path}"
              class="nav__tab ${this._activeTab === tab.path ? 'nav__tab--active' : ''}"
              style="animation-delay: ${i * 0.04}s"
              @click=${(e: Event) => this._handleTabClick(e, tab)}
            >
              <span class="nav__icon">${tab.icon()}</span>
              <span class="nav__label">${tab.label}</span>
            </a>
          `,
        )}
      </nav>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'velg-simulation-nav': VelgSimulationNav;
  }
}
