import { Router } from '@lit-labs/router';
import { css, html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { appState } from './services/AppStateManager.js';
import { authService } from './services/supabase/SupabaseAuthService.js';

import './components/auth/LoginView.js';
import './components/auth/RegisterView.js';
import './components/platform/SimulationsDashboard.js';

@customElement('velg-app')
export class VelgApp extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      font-family: var(--font-sans);
      color: var(--color-text-primary);
      background: var(--color-surface);
    }

    .app-header {
      height: var(--header-height);
      background: var(--color-surface-header);
      border-bottom: var(--border-default);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--space-6);
    }

    .app-header__title {
      font-family: var(--font-brutalist);
      font-weight: var(--font-black);
      font-size: var(--text-lg);
      text-transform: uppercase;
      letter-spacing: var(--tracking-brutalist);
    }

    .app-header__actions {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .app-header__signout {
      font-family: var(--font-brutalist);
      font-weight: var(--font-bold);
      font-size: var(--text-sm);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      padding: var(--space-1) var(--space-3);
      border: var(--border-medium);
      background: transparent;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .app-header__signout:hover {
      background: var(--color-surface-sunken);
    }

    .app-main {
      padding: var(--content-padding);
    }

    .loading-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 50vh;
      font-family: var(--font-brutalist);
      font-weight: var(--font-bold);
      font-size: var(--text-lg);
      text-transform: uppercase;
      letter-spacing: var(--tracking-brutalist);
      color: var(--color-text-secondary);
    }
  `;

  private _router = new Router(
    this,
    [
      {
        path: '/login',
        render: () => html`<velg-login-view></velg-login-view>`,
        enter: async () => {
          if (appState.isAuthenticated.value) {
            this._router.goto('/dashboard');
            return false;
          }
          return true;
        },
      },
      {
        path: '/register',
        render: () => html`<velg-register-view></velg-register-view>`,
        enter: async () => {
          if (appState.isAuthenticated.value) {
            this._router.goto('/dashboard');
            return false;
          }
          return true;
        },
      },
      {
        path: '/dashboard',
        render: () => html`<velg-simulations-dashboard></velg-simulations-dashboard>`,
        enter: async () => {
          if (!appState.isAuthenticated.value) {
            this._router.goto('/login');
            return false;
          }
          return true;
        },
      },
      {
        path: '/',
        render: () => html``,
        enter: async () => {
          if (appState.isAuthenticated.value) {
            this._router.goto('/dashboard');
          } else {
            this._router.goto('/login');
          }
          return false;
        },
      },
    ],
    {
      fallback: {
        render: () => html`<velg-login-view></velg-login-view>`,
      },
    },
  );

  @state() private _initializing = true;

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    await this._initAuth();
  }

  private async _initAuth(): Promise<void> {
    try {
      const { session } = await authService.getSession();
      if (session) {
        appState.setUser(session.user);
        appState.setAccessToken(session.access_token);
      }
    } finally {
      this._initializing = false;
    }
  }

  private async _handleSignOut(): Promise<void> {
    await authService.signOut();
    this._router.goto('/login');
  }

  protected render() {
    if (this._initializing) {
      return html`<div class="loading-container">Loading...</div>`;
    }

    return html`
      ${
        appState.isAuthenticated.value
          ? html`
          <header class="app-header">
            <span class="app-header__title">Velgarien</span>
            <div class="app-header__actions">
              <button
                class="app-header__signout"
                @click=${this._handleSignOut}
              >
                Sign Out
              </button>
            </div>
          </header>
        `
          : null
      }
      <main class="app-main">
        ${this._router.outlet()}
      </main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'velg-app': VelgApp;
  }
}
