import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import type { FilterChangeDetail } from '../shared/SharedFilterBar.js';

import '../shared/SharedFilterBar.js';

@customElement('velg-trend-filter-bar')
export class VelgTrendFilterBar extends LitElement {
  private _handleChange(e: CustomEvent<FilterChangeDetail>): void {
    this.dispatchEvent(
      new CustomEvent('filter-change', { detail: e.detail, bubbles: true, composed: true }),
    );
  }

  protected render() {
    return html`
      <velg-filter-bar
        .filters=${[
          {
            key: 'platform',
            label: 'Platform',
            type: 'select' as const,
            options: [
              { value: 'guardian', label: 'Guardian' },
              { value: 'newsapi', label: 'NewsAPI' },
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
        @filter-change=${this._handleChange}
      ></velg-filter-bar>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'velg-trend-filter-bar': VelgTrendFilterBar;
  }
}
