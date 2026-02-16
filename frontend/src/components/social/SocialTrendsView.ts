import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { socialTrendsApi } from '../../services/api/index.js';
import type { SocialTrend } from '../../types/index.js';
import type { FilterChangeDetail } from '../shared/SharedFilterBar.js';
import { VelgToast } from '../shared/Toast.js';

import '../shared/SharedFilterBar.js';
import '../shared/Pagination.js';
import '../shared/LoadingState.js';
import '../shared/ErrorState.js';
import '../shared/EmptyState.js';
import './TrendCard.js';
import './TransformationModal.js';

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
      const paginated = response.data;
      this._trends = paginated?.data ?? [];
      this._total = paginated?.total ?? this._trends.length;
    } else {
      this._error = response.error?.message || 'Failed to load trends';
    }
    this._loading = false;
  }

  private async _handleFetch(): Promise<void> {
    const query = prompt('Enter search query for trends:');
    if (!query) return;

    this._loading = true;
    const response = await socialTrendsApi.fetch(this.simulationId, {
      source: 'guardian',
      query,
      limit: 10,
    });

    if (response.success) {
      VelgToast.success('Trends fetched successfully');
      await this._loadTrends();
    } else {
      VelgToast.error(response.error?.message || 'Failed to fetch trends');
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
          <h1 class="trends__title">Social Trends</h1>
          <div class="trends__actions">
            <button class="trends__btn" @click=${this._handleFetch}>Fetch Trends</button>
          </div>
        </div>

        <velg-filter-bar
          .filters=${[
            {
              key: 'platform',
              label: 'Platform',
              type: 'select' as const,
              options: [
                { value: 'guardian', label: 'Guardian' },
                { value: 'newsapi', label: 'NewsAPI' },
                { value: 'facebook', label: 'Facebook' },
              ],
            },
            {
              key: 'sentiment',
              label: 'Sentiment',
              type: 'select' as const,
              options: [
                { value: 'positive', label: 'Positive' },
                { value: 'negative', label: 'Negative' },
                { value: 'neutral', label: 'Neutral' },
              ],
            },
            {
              key: 'is_processed',
              label: 'Processed',
              type: 'select' as const,
              options: [
                { value: 'true', label: 'Yes' },
                { value: 'false', label: 'No' },
              ],
            },
          ]}
          @filter-change=${this._handleFilterChange}
        ></velg-filter-bar>

        ${this._loading ? html`<velg-loading-state message="Loading trends..."></velg-loading-state>` : ''}
        ${this._error ? html`<velg-error-state message=${this._error} @retry=${this._loadTrends}></velg-error-state>` : ''}

        ${
          !this._loading && !this._error && this._trends.length === 0
            ? html`<velg-empty-state message="No trends found" actionLabel="Fetch Trends" @action=${this._handleFetch}></velg-empty-state>`
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

        ${
          this._showTransformModal && this._selectedTrend
            ? html`
          <velg-transformation-modal
            .trend=${this._selectedTrend}
            .simulationId=${this.simulationId}
            @close=${() => {
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
