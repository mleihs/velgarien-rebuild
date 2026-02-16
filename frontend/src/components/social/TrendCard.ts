import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { SocialTrend } from '../../types/index.js';

@customElement('velg-trend-card')
export class VelgTrendCard extends LitElement {
  static styles = css`
    :host { display: block; }

    .card {
      background: var(--color-surface-raised); border: var(--border-default);
      box-shadow: var(--shadow-md); display: flex; flex-direction: column;
      transition: all var(--transition-fast);
    }

    .card:hover { transform: translate(-2px, -2px); box-shadow: var(--shadow-lg); }

    .card__header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: var(--space-2); padding: var(--space-3) var(--space-4);
      background: var(--color-surface-header); border-bottom: var(--border-medium);
    }

    .card__title {
      font-family: var(--font-brutalist); font-weight: var(--font-black);
      font-size: var(--text-md); text-transform: uppercase;
      letter-spacing: var(--tracking-brutalist); margin: 0;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0;
    }

    .card__body { padding: var(--space-3) var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); flex: 1; }

    .card__badges { display: flex; flex-wrap: wrap; gap: var(--space-1-5); }

    .card__badge {
      display: inline-flex; align-items: center; padding: var(--space-0-5) var(--space-2);
      font-family: var(--font-brutalist); font-weight: var(--font-bold);
      font-size: var(--text-xs); text-transform: uppercase;
      letter-spacing: var(--tracking-wide); border: var(--border-width-default) solid var(--color-border);
      background: var(--color-surface-header);
    }

    .card__badge--platform { background: var(--color-primary-bg); border-color: var(--color-primary); color: var(--color-primary); }
    .card__badge--sentiment-positive { background: var(--color-success-bg); border-color: var(--color-success); color: var(--color-success); }
    .card__badge--sentiment-negative { background: var(--color-danger-bg); border-color: var(--color-danger); color: var(--color-danger); }
    .card__badge--sentiment-neutral { background: var(--color-info-bg); border-color: var(--color-info); color: var(--color-info); }
    .card__badge--processed { background: var(--color-warning-bg); border-color: var(--color-warning); color: var(--color-warning); }

    .card__meta { display: flex; flex-direction: column; gap: var(--space-1); }
    .card__meta-item { display: flex; align-items: center; gap: var(--space-1-5); font-size: var(--text-sm); color: var(--color-text-secondary); }

    .card__url { font-size: var(--text-sm); color: var(--color-primary); text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }
    .card__url:hover { text-decoration: underline; }

    .card__actions {
      display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-2) var(--space-4) var(--space-3); margin-top: auto;
    }

    .card__action-btn {
      display: inline-flex; align-items: center; justify-content: center;
      gap: var(--space-1); padding: var(--space-1-5) var(--space-3);
      font-family: var(--font-brutalist); font-weight: var(--font-bold);
      font-size: var(--text-xs); text-transform: uppercase; letter-spacing: var(--tracking-wide);
      background: transparent; border: var(--border-width-thin) solid var(--color-border-light);
      cursor: pointer; color: var(--color-text-secondary); transition: all var(--transition-fast);
    }

    .card__action-btn:hover { background: var(--color-surface-sunken); color: var(--color-text-primary); }
    .card__action-btn--primary:hover { background: var(--color-primary-bg); color: var(--color-primary); border-color: var(--color-primary); }
  `;

  @property({ type: Object }) trend!: SocialTrend;
  @property({ type: String }) simulationId = '';

  private _getSentimentClass(): string {
    switch (this.trend.sentiment) {
      case 'positive':
        return 'card__badge--sentiment-positive';
      case 'negative':
        return 'card__badge--sentiment-negative';
      default:
        return 'card__badge--sentiment-neutral';
    }
  }

  private _handleTransform(): void {
    this.dispatchEvent(
      new CustomEvent('trend-transform', { detail: this.trend, bubbles: true, composed: true }),
    );
  }

  private _handleIntegrate(): void {
    this.dispatchEvent(
      new CustomEvent('trend-integrate', { detail: this.trend, bubbles: true, composed: true }),
    );
  }

  protected render() {
    const t = this.trend;
    if (!t) return html``;

    return html`
      <div class="card">
        <div class="card__header">
          <h3 class="card__title">${t.name}</h3>
        </div>
        <div class="card__body">
          <div class="card__badges">
            <span class="card__badge card__badge--platform">${t.platform}</span>
            ${t.sentiment ? html`<span class="card__badge ${this._getSentimentClass()}">${t.sentiment}</span>` : ''}
            ${t.is_processed ? html`<span class="card__badge card__badge--processed">Processed</span>` : ''}
          </div>
          <div class="card__meta">
            ${t.volume ? html`<span class="card__meta-item">Volume: ${t.volume}</span>` : ''}
            ${t.relevance_score != null ? html`<span class="card__meta-item">Relevance: ${t.relevance_score}/10</span>` : ''}
          </div>
          ${t.url ? html`<a class="card__url" href=${t.url} target="_blank" rel="noopener">${t.url}</a>` : ''}
        </div>
        <div class="card__actions">
          <button class="card__action-btn card__action-btn--primary" @click=${this._handleTransform}>Transform</button>
          <button class="card__action-btn" @click=${this._handleIntegrate}>Integrate</button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'velg-trend-card': VelgTrendCard;
  }
}
