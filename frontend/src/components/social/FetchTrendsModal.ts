import { msg } from '@lit/localize';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import '../shared/BaseModal.js';

export interface FetchTrendsDetail {
  source: string;
  query: string;
  limit: number;
}

@customElement('velg-fetch-trends-modal')
export class VelgFetchTrendsModal extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .form {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .form__group {
      display: flex;
      flex-direction: column;
      gap: var(--space-1-5);
    }

    .form__label {
      font-family: var(--font-brutalist);
      font-weight: var(--font-bold);
      font-size: var(--text-xs);
      text-transform: uppercase;
      letter-spacing: var(--tracking-brutalist);
      color: var(--color-text-secondary);
    }

    .form__label--required::after {
      content: ' *';
      color: var(--color-danger);
    }

    .form__input,
    .form__select {
      font-family: var(--font-sans);
      font-size: var(--text-base);
      padding: var(--space-2) var(--space-3);
      border: var(--border-medium);
      background: var(--color-surface);
      color: var(--color-text-primary);
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    }

    .form__input:focus,
    .form__select:focus {
      outline: none;
      border-color: var(--color-border-focus);
      box-shadow: var(--ring-focus);
    }

    .form__row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
    }

    .form__hint {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
    }

    .form__error {
      font-family: var(--font-brutalist);
      font-weight: var(--font-bold);
      font-size: var(--text-xs);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      color: var(--color-danger);
    }

    .footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--space-3);
    }

    .footer__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-2) var(--space-4);
      font-family: var(--font-brutalist);
      font-weight: var(--font-black);
      font-size: var(--text-sm);
      text-transform: uppercase;
      letter-spacing: var(--tracking-brutalist);
      border: var(--border-default);
      box-shadow: var(--shadow-md);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .footer__btn:hover {
      transform: translate(-2px, -2px);
      box-shadow: var(--shadow-lg);
    }

    .footer__btn:active {
      transform: translate(0);
      box-shadow: var(--shadow-pressed);
    }

    .footer__btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    .footer__btn--cancel {
      background: var(--color-surface-raised);
      color: var(--color-text-primary);
    }

    .footer__btn--fetch {
      background: var(--color-primary);
      color: var(--color-text-inverse);
    }
  `;

  @property({ type: Boolean }) open = false;

  @state() private _source = 'guardian';
  @state() private _query = '';
  @state() private _limit = 10;
  @state() private _error: string | null = null;

  protected willUpdate(changedProperties: Map<PropertyKey, unknown>): void {
    if (changedProperties.has('open') && this.open) {
      this._resetForm();
    }
  }

  private _resetForm(): void {
    this._source = 'guardian';
    this._query = '';
    this._limit = 10;
    this._error = null;
  }

  private _handleClose(): void {
    this.dispatchEvent(
      new CustomEvent('modal-close', {
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleSubmit(e?: Event): void {
    e?.preventDefault();

    if (!this._query.trim()) {
      this._error = msg('Search query is required');
      return;
    }

    this.dispatchEvent(
      new CustomEvent<FetchTrendsDetail>('fetch-trends', {
        detail: {
          source: this._source,
          query: this._query.trim(),
          limit: this._limit,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  protected render() {
    return html`
      <velg-base-modal
        ?open=${this.open}
        @modal-close=${this._handleClose}
      >
        <span slot="header">${msg('Fetch Trends')}</span>

        <form class="form" @submit=${this._handleSubmit}>
          <div class="form__group">
            <label class="form__label form__label--required">${msg('Search Query')}</label>
            <input
              class="form__input"
              type="text"
              .value=${this._query}
              @input=${(e: InputEvent) => {
                this._query = (e.target as HTMLInputElement).value;
              }}
              placeholder="e.g. climate change, technology, politics..."
              required
            />
            <span class="form__hint">${msg('Enter keywords to search for relevant trends')}</span>
          </div>

          <div class="form__row">
            <div class="form__group">
              <label class="form__label">${msg('Source')}</label>
              <select
                class="form__select"
                .value=${this._source}
                @change=${(e: Event) => {
                  this._source = (e.target as HTMLSelectElement).value;
                }}
              >
                <option value="guardian">${msg('The Guardian')}</option>
                <option value="newsapi">${msg('NewsAPI')}</option>
              </select>
            </div>

            <div class="form__group">
              <label class="form__label">${msg('Limit')}</label>
              <select
                class="form__select"
                .value=${String(this._limit)}
                @change=${(e: Event) => {
                  this._limit = Number((e.target as HTMLSelectElement).value);
                }}
              >
                <option value="5">${msg('5 results')}</option>
                <option value="10">${msg('10 results')}</option>
                <option value="20">${msg('20 results')}</option>
                <option value="50">${msg('50 results')}</option>
              </select>
            </div>
          </div>

          ${this._error ? html`<div class="form__error">${this._error}</div>` : null}
        </form>

        <div slot="footer" class="footer">
          <button
            class="footer__btn footer__btn--cancel"
            @click=${this._handleClose}
          >
            ${msg('Cancel')}
          </button>
          <button
            class="footer__btn footer__btn--fetch"
            @click=${this._handleSubmit}
          >
            ${msg('Fetch Trends')}
          </button>
        </div>
      </velg-base-modal>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'velg-fetch-trends-modal': VelgFetchTrendsModal;
  }
}
