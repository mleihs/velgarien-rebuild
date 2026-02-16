import { msg, str } from '@lit/localize';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { appState } from '../../services/AppStateManager.js';
import { socialTrendsApi } from '../../services/api/index.js';
import type { SocialTrend } from '../../types/index.js';
import { VelgToast } from '../shared/Toast.js';

import '../shared/BaseModal.js';

type Step = 'preview' | 'transform' | 'integrate';

@customElement('velg-transformation-modal')
export class VelgTransformationModal extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .wizard {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    /* Step indicator */
    .wizard__steps {
      display: flex;
      gap: 0;
      border: var(--border-default);
    }

    .wizard__step {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-1-5);
      padding: var(--space-2) var(--space-3);
      font-family: var(--font-brutalist);
      font-weight: var(--font-bold);
      font-size: var(--text-xs);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      background: var(--color-surface-sunken);
      color: var(--color-text-muted);
      border-right: var(--border-width-thin) solid var(--color-border);
    }

    .wizard__step:last-child {
      border-right: none;
    }

    .wizard__step--active {
      background: var(--color-primary);
      color: var(--color-text-inverse);
    }

    .wizard__step--done {
      background: var(--color-success-bg);
      color: var(--color-success);
    }

    .wizard__step-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      font-weight: var(--font-black);
      font-size: var(--text-xs);
      border: var(--border-width-default) solid currentColor;
    }

    /* Content sections */
    .wizard__section {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .wizard__label {
      font-family: var(--font-brutalist);
      font-weight: var(--font-black);
      font-size: var(--text-sm);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      color: var(--color-text-primary);
    }

    .wizard__original {
      padding: var(--space-3);
      background: var(--color-surface-sunken);
      border: var(--border-width-thin) solid var(--color-border-light);
      font-size: var(--text-sm);
      line-height: 1.5;
    }

    .wizard__original-title {
      font-weight: var(--font-bold);
      margin-bottom: var(--space-1);
    }

    .wizard__original-meta {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      margin-top: var(--space-1);
    }

    .wizard__result {
      padding: var(--space-3);
      background: var(--color-primary-bg);
      border: var(--border-width-default) solid var(--color-primary);
      font-size: var(--text-sm);
      white-space: pre-wrap;
      line-height: 1.6;
    }

    .wizard__model-info {
      font-family: var(--font-brutalist);
      font-size: var(--text-xs);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
    }

    /* Form fields for integrate step */
    .wizard__form {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .wizard__form-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-1-5);
    }

    .wizard__form-label {
      font-family: var(--font-brutalist);
      font-weight: var(--font-bold);
      font-size: var(--text-xs);
      text-transform: uppercase;
      letter-spacing: var(--tracking-brutalist);
      color: var(--color-text-secondary);
    }

    .wizard__form-label--required::after {
      content: ' *';
      color: var(--color-danger);
    }

    .wizard__form-input,
    .wizard__form-select,
    .wizard__form-textarea {
      font-family: var(--font-sans);
      font-size: var(--text-base);
      padding: var(--space-2) var(--space-3);
      border: var(--border-medium);
      background: var(--color-surface);
      color: var(--color-text-primary);
      transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
    }

    .wizard__form-input:focus,
    .wizard__form-select:focus,
    .wizard__form-textarea:focus {
      outline: none;
      border-color: var(--color-border-focus);
      box-shadow: var(--ring-focus);
    }

    .wizard__form-textarea {
      resize: vertical;
      min-height: 80px;
    }

    .wizard__form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-3);
    }

    .wizard__error {
      font-family: var(--font-brutalist);
      font-weight: var(--font-bold);
      font-size: var(--text-xs);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      color: var(--color-danger);
    }

    /* Footer */
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

    .footer__btn--primary {
      background: var(--color-primary);
      color: var(--color-text-inverse);
    }

    .footer__btn--success {
      background: var(--color-success);
      color: var(--color-text-inverse);
    }
  `;

  @property({ type: Object }) trend!: SocialTrend;
  @property({ type: String }) simulationId = '';
  @property({ type: Boolean }) open = false;

  @state() private _step: Step = 'preview';
  @state() private _loading = false;
  @state() private _error: string | null = null;

  // Transform result
  @state() private _transformedContent = '';
  @state() private _modelUsed = '';

  // Integrate form
  @state() private _eventTitle = '';
  @state() private _eventDescription = '';
  @state() private _eventType = 'news';
  @state() private _impactLevel = 5;

  protected willUpdate(changedProperties: Map<PropertyKey, unknown>): void {
    if (changedProperties.has('open') && this.open) {
      this._resetWizard();
    }
  }

  private _resetWizard(): void {
    this._step = 'preview';
    this._loading = false;
    this._error = null;
    this._transformedContent = '';
    this._modelUsed = '';
    this._eventTitle = '';
    this._eventDescription = '';
    this._eventType = 'news';
    this._impactLevel = 5;
  }

  private _handleClose(): void {
    this.dispatchEvent(new CustomEvent('modal-close', { bubbles: true, composed: true }));
  }

  private async _handleTransform(): Promise<void> {
    this._loading = true;
    this._error = null;

    const response = await socialTrendsApi.transform(this.simulationId, {
      trend_id: this.trend.id,
    });

    if (response.success && response.data) {
      const data = response.data as {
        transformation?: { content?: string; model_used?: string };
      };
      this._transformedContent = data.transformation?.content ?? '';
      this._modelUsed = data.transformation?.model_used ?? '';

      // Pre-fill integrate form
      this._eventTitle = this._transformedContent.split('\n')[0] || this.trend.name;
      this._eventDescription = this._transformedContent;

      this._step = 'transform';
    } else {
      this._error = response.error?.message || msg('Transformation failed');
      VelgToast.error(this._error);
    }
    this._loading = false;
  }

  private _handleProceedToIntegrate(): void {
    this._step = 'integrate';
  }

  private async _handleIntegrate(): Promise<void> {
    if (!this._eventTitle.trim()) {
      this._error = msg('Title is required');
      return;
    }

    this._loading = true;
    this._error = null;

    const response = await socialTrendsApi.integrate(this.simulationId, {
      trend_id: this.trend.id,
      title: this._eventTitle.trim(),
      description: this._eventDescription.trim() || undefined,
      event_type: this._eventType,
      impact_level: this._impactLevel,
      tags: [this.trend.platform],
    });

    if (response.success) {
      VelgToast.success(msg('Event created from trend'));
      this.dispatchEvent(
        new CustomEvent('transform-complete', {
          detail: response.data,
          bubbles: true,
          composed: true,
        }),
      );
    } else {
      this._error = response.error?.message || msg('Integration failed');
      VelgToast.error(this._error);
    }
    this._loading = false;
  }

  private _getStepClass(step: Step): string {
    const steps: Step[] = ['preview', 'transform', 'integrate'];
    const current = steps.indexOf(this._step);
    const target = steps.indexOf(step);
    if (target === current) return 'wizard__step--active';
    if (target < current) return 'wizard__step--done';
    return '';
  }

  private _getEventTypeTaxonomies() {
    return appState.getTaxonomiesByType('event_type');
  }

  private _renderPreview() {
    const raw = this.trend.raw_data as Record<string, string> | undefined;
    return html`
      <div class="wizard__section">
        <div class="wizard__label">${msg('Original Article')}</div>
        <div class="wizard__original">
          <div class="wizard__original-title">${this.trend.name}</div>
          ${
            raw?.trail_text || raw?.description
              ? html`<div>${raw.trail_text || raw.description}</div>`
              : nothing
          }
          <div class="wizard__original-meta">
            ${this.trend.platform}
            ${raw?.byline || raw?.author ? html` &mdash; ${raw.byline || raw.author}` : nothing}
            ${this.trend.url ? html` &mdash; <a href=${this.trend.url} target="_blank" rel="noopener">${this.trend.url}</a>` : nothing}
          </div>
        </div>
      </div>
    `;
  }

  private _renderTransformResult() {
    return html`
      ${this._renderPreview()}
      <div class="wizard__section">
        <div class="wizard__label">${msg('Transformed')}</div>
        <div class="wizard__result">${this._transformedContent}</div>
        ${
          this._modelUsed
            ? html`<div class="wizard__model-info">${msg(str`Model: ${this._modelUsed}`)}</div>`
            : nothing
        }
      </div>
    `;
  }

  private _renderIntegrateForm() {
    const eventTypes = this._getEventTypeTaxonomies();

    return html`
      <div class="wizard__form">
        <div class="wizard__form-group">
          <label class="wizard__form-label wizard__form-label--required">${msg('Event Title')}</label>
          <input
            class="wizard__form-input"
            type="text"
            .value=${this._eventTitle}
            @input=${(e: InputEvent) => {
              this._eventTitle = (e.target as HTMLInputElement).value;
            }}
            placeholder=${msg('Title for the new event')}
          />
        </div>

        <div class="wizard__form-group">
          <label class="wizard__form-label">${msg('Description')}</label>
          <textarea
            class="wizard__form-textarea"
            .value=${this._eventDescription}
            @input=${(e: InputEvent) => {
              this._eventDescription = (e.target as HTMLTextAreaElement).value;
            }}
            placeholder=${msg('Event description (pre-filled from transformation)')}
          ></textarea>
        </div>

        <div class="wizard__form-row">
          <div class="wizard__form-group">
            <label class="wizard__form-label">${msg('Event Type')}</label>
            <select
              class="wizard__form-select"
              .value=${this._eventType}
              @change=${(e: Event) => {
                this._eventType = (e.target as HTMLSelectElement).value;
              }}
            >
              <option value="news">${msg('News')}</option>
              ${eventTypes.map(
                (t) => html`<option value=${t.value}>${t.label?.en ?? t.value}</option>`,
              )}
            </select>
          </div>

          <div class="wizard__form-group">
            <label class="wizard__form-label">${msg(str`Impact Level (${this._impactLevel}/10)`)}</label>
            <input
              class="wizard__form-input"
              type="range"
              min="1"
              max="10"
              step="1"
              .value=${String(this._impactLevel)}
              @input=${(e: InputEvent) => {
                this._impactLevel = Number((e.target as HTMLInputElement).value);
              }}
            />
          </div>
        </div>
      </div>
    `;
  }

  private _renderStepContent() {
    switch (this._step) {
      case 'preview':
        return this._renderPreview();
      case 'transform':
        return this._renderTransformResult();
      case 'integrate':
        return this._renderIntegrateForm();
    }
  }

  private _renderFooterButtons() {
    switch (this._step) {
      case 'preview':
        return html`
          <button class="footer__btn footer__btn--cancel" @click=${this._handleClose}>${msg('Cancel')}</button>
          <button
            class="footer__btn footer__btn--primary"
            @click=${this._handleTransform}
            ?disabled=${this._loading}
          >
            ${this._loading ? msg('Transforming...') : msg('Transform')}
          </button>
        `;
      case 'transform':
        return html`
          <button class="footer__btn footer__btn--cancel" @click=${this._handleClose}>${msg('Cancel')}</button>
          <button
            class="footer__btn footer__btn--primary"
            @click=${this._handleTransform}
            ?disabled=${this._loading}
          >
            ${msg('Re-Transform')}
          </button>
          <button
            class="footer__btn footer__btn--success"
            @click=${this._handleProceedToIntegrate}
          >
            ${msg('Create Event')}
          </button>
        `;
      case 'integrate':
        return html`
          <button
            class="footer__btn footer__btn--cancel"
            @click=${() => {
              this._step = 'transform';
            }}
          >
            ${msg('Back')}
          </button>
          <button
            class="footer__btn footer__btn--success"
            @click=${this._handleIntegrate}
            ?disabled=${this._loading}
          >
            ${this._loading ? msg('Creating...') : msg('Save as Event')}
          </button>
        `;
    }
  }

  protected render() {
    return html`
      <velg-base-modal ?open=${this.open} @modal-close=${this._handleClose}>
        <span slot="header">${msg('News → Event')}</span>

        <div class="wizard">
          <div class="wizard__steps">
            <div class="wizard__step ${this._getStepClass('preview')}">
              <span class="wizard__step-number">1</span> ${msg('Preview')}
            </div>
            <div class="wizard__step ${this._getStepClass('transform')}">
              <span class="wizard__step-number">2</span> ${msg('Transform')}
            </div>
            <div class="wizard__step ${this._getStepClass('integrate')}">
              <span class="wizard__step-number">3</span> ${msg('Event')}
            </div>
          </div>

          ${this._renderStepContent()}

          ${this._error ? html`<div class="wizard__error">${this._error}</div>` : nothing}
        </div>

        <div slot="footer" class="footer">
          ${this._renderFooterButtons()}
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
