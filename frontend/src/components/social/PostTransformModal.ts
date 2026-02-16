import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { socialMediaApi } from '../../services/api/index.js';
import type { SocialMediaPost } from '../../types/index.js';
import { VelgToast } from '../shared/Toast.js';

import '../shared/BaseModal.js';

@customElement('velg-post-transform-modal')
export class VelgPostTransformModal extends LitElement {
  static styles = css`
    .transform { display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-4); }
    .transform__original { padding: var(--space-3); background: var(--color-surface-sunken); border: var(--border-width-thin) solid var(--color-border-light); font-size: var(--text-sm); }
    .transform__types { display: flex; gap: var(--space-2); }
    .transform__type-btn {
      flex: 1; padding: var(--space-2) var(--space-3); font-family: var(--font-brutalist);
      font-weight: var(--font-bold); font-size: var(--text-sm); text-transform: uppercase;
      letter-spacing: var(--tracking-wide); background: var(--color-surface-raised);
      border: var(--border-default); cursor: pointer; transition: all var(--transition-fast);
      text-align: center;
    }
    .transform__type-btn--active { background: var(--color-primary); color: var(--color-text-inverse); }
    .transform__result { padding: var(--space-3); background: var(--color-primary-bg); border: var(--border-width-default) solid var(--color-primary); font-size: var(--text-sm); white-space: pre-wrap; }
    .transform__actions { display: flex; gap: var(--space-2); justify-content: flex-end; }
    .transform__btn {
      padding: var(--space-2) var(--space-4); font-family: var(--font-brutalist);
      font-weight: var(--font-bold); font-size: var(--text-sm); text-transform: uppercase;
      letter-spacing: var(--tracking-wide); border: var(--border-default); cursor: pointer;
    }
    .transform__btn--primary { background: var(--color-primary); color: var(--color-text-inverse); }
    .transform__btn--secondary { background: var(--color-surface-raised); }
    .transform__label { font-family: var(--font-brutalist); font-weight: var(--font-bold); font-size: var(--text-sm); text-transform: uppercase; letter-spacing: var(--tracking-wide); }
  `;

  @property({ type: Object }) post!: SocialMediaPost;
  @property({ type: String }) simulationId = '';
  @state() private _type: 'dystopian' | 'propaganda' | 'surveillance' = 'dystopian';
  @state() private _loading = false;

  private async _handleTransform(): Promise<void> {
    this._loading = true;
    const response = await socialMediaApi.transformPost(this.simulationId, this.post.id, {
      transformation_type: this._type,
    });
    if (response.success) {
      VelgToast.success('Post transformed');
      this.dispatchEvent(new CustomEvent('transform-complete', { bubbles: true, composed: true }));
    } else {
      VelgToast.error(response.error?.message || 'Transform failed');
    }
    this._loading = false;
  }

  private _handleClose(): void {
    this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
  }

  protected render() {
    return html`
      <velg-base-modal .open=${true} title="Transform Post" @close=${this._handleClose}>
        <div class="transform">
          <div>
            <div class="transform__label">Original Message</div>
            <div class="transform__original">${this.post.message || 'No content'}</div>
          </div>
          <div>
            <div class="transform__label">Transformation Type</div>
            <div class="transform__types">
              ${(['dystopian', 'propaganda', 'surveillance'] as const).map(
                (t) => html`
                <button
                  class="transform__type-btn ${this._type === t ? 'transform__type-btn--active' : ''}"
                  @click=${() => {
                    this._type = t;
                  }}
                >${t}</button>
              `,
              )}
            </div>
          </div>
          <div class="transform__actions">
            <button class="transform__btn transform__btn--secondary" @click=${this._handleClose}>Cancel</button>
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
    'velg-post-transform-modal': VelgPostTransformModal;
  }
}
