import { msg } from '@lit/localize';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { socialTrendsApi } from '../../services/api/index.js';
import type { SocialTrend } from '../../types/index.js';
import type { FilterChangeDetail } from '../shared/SharedFilterBar.js';
import { VelgToast } from '../shared/Toast.js';
import type { FetchTrendsDetail } from './FetchTrendsModal.js';

import '../shared/SharedFilterBar.js';
import '../shared/Pagination.js';
import '../shared/LoadingState.js';
import '../shared/ErrorState.js';
import '../shared/EmptyState.js';
import './TrendCard.js';
import './TransformationModal.js';
import './FetchTrendsModal.js';

@customElement('velg-social-trends-view')
export class VelgSocialTrendsView extends LitElement {
  static styles = css`
    :host { display: block; }

    .trends { display: flex; flex-direction: column; gap: var(--space-4); }

    .trends__header {
      display: flex; align-items: center; justify-content: space-between; gap: var(--space-4);
    }

    .trends__title {
      font-family: var(--font-brutalist); font-weight: var(--font-black);
      font-size: var(--text-2xl); text-transform: uppercase;
      letter-spacing: var(--tracking-brutalist); margin: 0;
    }

    .trends__actions { display: flex; gap: var(--space-2); }

    .trends__btn {
      display: inline-flex; align-items: center; justify-content: center;
      gap: var(--space-2); padding: var(--space-2-5) var(--space-5);
      font-family: var(--font-brutalist); font-weight: var(--font-black);
      font-size: var(--text-sm); text-transform: uppercase;
      letter-spacing: var(--tracking-brutalist); background: var(--color-primary);
      color: var(--color-text-inverse); border: var(--border-default);
      box-shadow: var(--shadow-md); cursor: pointer; transition: all var(--transition-fast);
    }

    .trends__btn:hover {
      transform: translate(-2px, -2px); box-shadow: var(--shadow-lg);
      background: var(--color-primary-hover);
    }

    .trends__btn:active { transform: translate(0); box-shadow: var(--shadow-pressed); }

    .trends__btn--secondary {
      background: var(--color-surface-raised); color: var(--color-text-primary);
    }

    .trends__btn--secondary:hover { background: var(--color-surface-header); }

    .trends__grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--space-4);
    }
  `;

  @property({ type: String }) simulationId = '';
  @state() private _trends: SocialTrend[] = [];
  @state() private _loading = false;
  @state() private _error: string | null = null;
  @state() private _total = 0;
  @state() private _page = 1;
  @state() private _pageSize = 25;
  @state() private _filters: Record<string, string> = {};
  @state() private _showTransformModal = false;
  @state() private _selectedTrend: SocialTrend | null = null;
  @state() private _showFetchModal = false;

  connectedCallback(): void {
    super.connectedCallback();
    this._loadTrends();
  }

  private async _loadTrends(): Promise<void> {
    this._loading = true;
    this._error = null;
    const params: Record<string, string> = {
      limit: String(this._pageSize),
      offset: String((this._page - 1) * this._pageSize),
      ...this._filters,
    };

    const response = await socialTrendsApi.list(this.simulationId, params);
    if (response.success && response.data) {
      this._trends = Array.isArray(response.data) ? response.data : [];
      this._total = response.meta?.total ?? this._trends.length;
    } else {
      this._error = response.error?.message || msg('Failed to load trends');
    }
    this._loading = false;
  }

  private async _handleFetchTrends(e: CustomEvent<FetchTrendsDetail>): Promise<void> {
    this._showFetchModal = false;
    this._loading = true;

    const { source, query, limit } = e.detail;
    const response = await socialTrendsApi.fetch(this.simulationId, {
      source,
      query,
      limit,
    });

    if (response.success) {
      VelgToast.success(msg('Trends fetched successfully'));
      await this._loadTrends();
    } else {
      VelgToast.error(response.error?.message || msg('Failed to fetch trends'));
      this._loading = false;
    }
  }

  private _handleFilterChange(e: CustomEvent<FilterChangeDetail>): void {
    this._filters = { ...e.detail.filters };
    this._page = 1;
    this._loadTrends();
  }

  private _handlePageChange(e: CustomEvent<{ page: number }>): void {
    this._page = e.detail.page;
    this._loadTrends();
  }

  private _handleTransform(e: CustomEvent<SocialTrend>): void {
    this._selectedTrend = e.detail;
    this._showTransformModal = true;
  }

  private _handleTransformComplete(): void {
    this._showTransformModal = false;
    this._selectedTrend = null;
    this._loadTrends();
  }

  protected render() {
    return html`
      <div class="trends">
        <div class="trends__header">
          <h1 class="trends__title">${msg('Social Trends')}</h1>
          <div class="trends__actions">
            <button class="trends__btn" @click=${() => {
              this._showFetchModal = true;
            }}>
              ${msg('Fetch Trends')}
            </button>
          </div>
        </div>

        <velg-filter-bar
          .filters=${[
            {
              key: 'platform',
              label: msg('Platform'),
              type: 'select' as const,
              options: [
                { value: 'guardian', label: msg('Guardian') },
                { value: 'newsapi', label: msg('NewsAPI') },
                { value: 'facebook', label: msg('Facebook') },
              ],
            },
            {
              key: 'sentiment',
              label: msg('Sentiment'),
              type: 'select' as const,
              options: [
                { value: 'positive', label: msg('Positive') },
                { value: 'negative', label: msg('Negative') },
                { value: 'neutral', label: msg('Neutral') },
              ],
            },
            {
              key: 'is_processed',
              label: msg('Processed'),
              type: 'select' as const,
              options: [
                { value: 'true', label: msg('Yes') },
                { value: 'false', label: msg('No') },
              ],
            },
          ]}
          @filter-change=${this._handleFilterChange}
        ></velg-filter-bar>

        ${this._loading ? html`<velg-loading-state message=${msg('Loading trends...')}></velg-loading-state>` : ''}
        ${this._error ? html`<velg-error-state message=${this._error} @retry=${this._loadTrends}></velg-error-state>` : ''}

        ${
          !this._loading && !this._error && this._trends.length === 0
            ? html`<velg-empty-state
                message=${msg('No trends found')}
                actionLabel=${msg('Fetch Trends')}
                @action=${() => {
                  this._showFetchModal = true;
                }}
              ></velg-empty-state>`
            : ''
        }

        ${
          !this._loading && this._trends.length > 0
            ? html`
          <div class="trends__grid">
            ${this._trends.map(
              (t) => html`
              <velg-trend-card
                .trend=${t}
                .simulationId=${this.simulationId}
                @trend-transform=${this._handleTransform}
                @trend-integrate=${this._handleTransform}
              ></velg-trend-card>
            `,
            )}
          </div>

          <velg-pagination
            .currentPage=${this._page}
            .totalItems=${this._total}
            .pageSize=${this._pageSize}
            @page-change=${this._handlePageChange}
          ></velg-pagination>
        `
            : ''
        }

        <velg-fetch-trends-modal
          ?open=${this._showFetchModal}
          @modal-close=${() => {
            this._showFetchModal = false;
          }}
          @fetch-trends=${this._handleFetchTrends}
        ></velg-fetch-trends-modal>

        ${
          this._showTransformModal && this._selectedTrend
            ? html`
          <velg-transformation-modal
            .trend=${this._selectedTrend}
            .simulationId=${this.simulationId}
            ?open=${true}
            @modal-close=${() => {
              this._showTransformModal = false;
            }}
            @transform-complete=${this._handleTransformComplete}
          ></velg-transformation-modal>
        `
            : ''
        }
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'velg-social-trends-view': VelgSocialTrendsView;
  }
}
