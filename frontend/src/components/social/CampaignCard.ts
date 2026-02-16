import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Campaign } from '../../types/index.js';

@customElement('velg-campaign-card')
export class VelgCampaignCard extends LitElement {
  static styles = css`
    :host { display: block; }
    .card {
      background: var(--color-surface-raised); border: var(--border-default);
      box-shadow: var(--shadow-md); display: flex; flex-direction: column;
      cursor: pointer; transition: all var(--transition-fast);
    }
    .card:hover { transform: translate(-2px, -2px); box-shadow: var(--shadow-lg); }
    .card__header {
      padding: var(--space-3) var(--space-4); background: var(--color-surface-header);
      border-bottom: var(--border-medium);
    }
    .card__title { font-family: var(--font-brutalist); font-weight: var(--font-black); font-size: var(--text-md); text-transform: uppercase; letter-spacing: var(--tracking-brutalist); margin: 0; }
    .card__body { padding: var(--space-3) var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); flex: 1; }
    .card__description { font-size: var(--text-sm); color: var(--color-text-secondary); line-height: var(--leading-relaxed); max-height: 60px; overflow: hidden; }
    .card__badges { display: flex; flex-wrap: wrap; gap: var(--space-1-5); }
    .card__badge { display: inline-flex; padding: var(--space-0-5) var(--space-2); font-family: var(--font-brutalist); font-weight: var(--font-bold); font-size: var(--text-xs); text-transform: uppercase; letter-spacing: var(--tracking-wide); border: var(--border-width-default) solid var(--color-border); background: var(--color-surface-header); }
    .card__badge--type { background: var(--color-primary-bg); border-color: var(--color-primary); color: var(--color-primary); }
    .card__badge--urgency { background: var(--color-warning-bg); border-color: var(--color-warning); color: var(--color-warning); }
    .card__badge--integrated { background: var(--color-success-bg); border-color: var(--color-success); color: var(--color-success); }
  `;

  @property({ type: Object }) campaign!: Campaign;
  @property({ type: String }) simulationId = '';

  private _handleClick(): void {
    this.dispatchEvent(
      new CustomEvent('campaign-click', { detail: this.campaign, bubbles: true, composed: true }),
    );
  }

  protected render() {
    const c = this.campaign;
    if (!c) return html``;

    return html`
      <div class="card" @click=${this._handleClick}>
        <div class="card__header">
          <h3 class="card__title">${c.title}</h3>
        </div>
        <div class="card__body">
          ${c.description ? html`<div class="card__description">${c.description}</div>` : ''}
          <div class="card__badges">
            ${c.campaign_type ? html`<span class="card__badge card__badge--type">${c.campaign_type}</span>` : ''}
            ${c.urgency_level ? html`<span class="card__badge card__badge--urgency">${c.urgency_level}</span>` : ''}
            ${c.is_integrated_as_event ? html`<span class="card__badge card__badge--integrated">Event</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'velg-campaign-card': VelgCampaignCard;
  }
}
