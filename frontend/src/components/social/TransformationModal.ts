import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { socialTrendsApi } from '../../services/api/index.js';
import type { SocialTrend } from '../../types/index.js';
import { VelgToast } from '../shared/Toast.js';

import '../shared/BaseModal.js';

@customElement('velg-transformation-modal')
export class VelgTransformationModal extends LitElement {
  static styles = css`
    .transform { display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-4); }
    .transform__original { padding: var(--space-3); background: var(--color-surface-sunken); border: var(--border-width-thin) solid var(--color-border-light); font-size: var(--text-sm); }
    .transform__result { padding: var(--space-3); background: var(--color-primary-bg); border: var(--border-width-default) solid var(--color-primary); font-size: var(--text-sm); white-space: pre-wrap; }
    .transform__actions { display: flex; gap: var(--space-2); justify-content: flex-end; }
    .transform__btn {
      padding: var(--space-2) var(--space-4); font-family: var(--font-brutalist);
      font-weight: var(--font-bold); font-size: var(--text-sm); text-transform: uppercase;
      letter-spacing: var(--tracking-wide); border: var(--border-default);
      cursor: pointer; transition: all var(--transition-fast);
    }
    .transform__btn--primary { background: var(--color-primary); color: var(--color-text-inverse); }
    .transform__btn--secondary { background: var(--color-surface-raised); color: var(--color-text-primary); }
    .transform__label { font-family: var(--font-brutalist); font-weight: var(--font-bold); font-size: var(--text-sm); text-transform: uppercase; letter-spacing: var(--tracking-wide); }
  `;

  @property({ type: Object }) trend!: SocialTrend;
  @property({ type: String }) simulationId = '';
  @state() private _result: string | null = null;
  @state() private _loading = false;

  private async _handleTransform(): Promise<void> {
    this._loading = true;
    const response = await socialTrendsApi.transform(this.simulationId, {
      trend_id: this.trend.id,
      transformation_type: 'dystopian',
    });

    if (response.success && response.data) {
      this._result = JSON.stringify(response.data, null, 2);
      VelgToast.success('Transformation complete');
    } else {
      VelgToast.error(response.error?.message || 'Transformation failed');
    }
    this._loading = false;
  }

  private _handleClose(): void {
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
    if (this._result) {
      this.dispatchEvent(new CustomEvent('transform-complete', { bubbles: true, composed: true }));
    }
  }

  protected render() {
    return html`
      <velg-base-modal .open=${true} title="Transform Trend" @close=${this._handleClose}>
        <div class="transform">
          <div>
            <div class="transform__label">Original</div>
            <div class="transform__original">${this.trend.name}</div>
          </div>

          ${
            this._result
              ? html`
            <div>
              <div class="transform__label">Transformed</div>
              <div class="transform__result">${this._result}</div>
            </div>
          `
              : ''
          }

          <div class="transform__actions">
            <button class="transform__btn transform__btn--secondary" @click=${this._handleClose}>Close</button>
            <button class="transform__btn transform__btn--primary" @click=${this._handleTransform} ?disabled=${this._loading}>
              ${this._loading ? 'Transforming...' : 'Transform'}
            </button>
          </div>
        </div>
      </velg-base-modal>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'velg-transformation-modal': VelgTransformationModal;
  }
}
