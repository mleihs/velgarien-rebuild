import { localized, msg } from '@lit/localize';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { Resonance } from '../../types/index.js';
import { icons } from '../../utils/icons.js';

/** Human-readable archetype labels. */
const ARCHETYPE_LABELS: Record<string, string> = {
  economic_tremor: 'The Tower',
  conflict_wave: 'The Shadow',
  biological_tide: 'The Devouring Mother',
  elemental_surge: 'The Deluge',
  authority_fracture: 'The Overthrow',
  innovation_spark: 'The Prometheus',
  consciousness_drift: 'The Awakening',
  decay_bloom: 'The Entropy',
};

@localized()
@customElement('resonance-card')
export class ResonanceCard extends LitElement {
  static styles = css`
    :host {
      display: block;
      contain: content;
    }

    /* ── Card Shell ─────────────────────────────────────────── */

    .card {
      position: relative;
      background: var(--color-surface);
      border: var(--border-default);
      padding: var(--space-4);
      cursor: pointer;
      transition:
        transform var(--duration-normal) var(--ease-out),
        box-shadow var(--duration-normal) var(--ease-out);
      overflow: hidden;
      opacity: 0;
      animation: card-enter var(--duration-entrance, 350ms)
        var(--ease-dramatic, cubic-bezier(0.22, 1, 0.36, 1)) forwards;
      animation-delay: calc(var(--i, 0) * var(--duration-stagger, 40ms));
    }

    .card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, 0.015) 2px,
        rgba(0, 0, 0, 0.015) 4px
      );
      pointer-events: none;
      z-index: 1;
    }

    .card:hover {
      transform: translate(-2px, -2px);
      box-shadow: var(--shadow-lg);
    }

    .card:active {
      transform: translate(0);
      box-shadow: var(--shadow-pressed);
    }

    .card:focus-visible {
      outline: none;
      box-shadow: var(--ring-focus);
    }

    .card.status-impacting {
      border-color: var(--color-danger);
      animation: card-enter var(--duration-entrance, 350ms)
          var(--ease-dramatic) forwards,
        impacting-border 2s ease-in-out infinite;
      animation-delay: calc(var(--i, 0) * var(--duration-stagger, 40ms)), 0s;
    }

    .card.status-detected {
      border-color: var(--color-info);
    }

    .card.status-subsiding {
      border-color: var(--color-warning);
    }

    .card.status-archived {
      border-color: var(--color-border-light);
      opacity: 0.7;
    }

    /* ── Header ────────────────────────────────────────────── */

    .header {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      margin-bottom: var(--space-3);
    }

    .icon-wrap {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: var(--border-width-default) solid var(--color-border);
      background: var(--color-surface-sunken);
      color: var(--color-text-primary);
      transition: color var(--transition-normal), border-color var(--transition-normal);
    }

    .status-impacting .icon-wrap {
      color: var(--color-danger);
      border-color: var(--color-danger);
      animation: icon-glow 2s ease-in-out infinite;
    }

    .status-detected .icon-wrap {
      color: var(--color-info);
      border-color: var(--color-info);
    }

    .status-subsiding .icon-wrap {
      color: var(--color-warning);
      border-color: var(--color-warning);
    }

    .title-block {
      flex: 1;
      min-width: 0;
    }

    .archetype-label {
      font-family: var(--font-bureau);
      font-size: var(--text-xs);
      font-weight: var(--font-medium);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wider);
      line-height: var(--leading-none);
      margin-bottom: var(--space-1);
    }

    .title {
      font-family: var(--font-brutalist);
      font-size: var(--text-sm);
      font-weight: var(--font-bold);
      color: var(--color-text-primary);
      line-height: var(--leading-tight);
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    /* ── Status + Countdown Row ────────────────────────────── */

    .meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2);
      margin-bottom: var(--space-3);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-0-5) var(--space-2);
      font-family: var(--font-brutalist);
      font-size: var(--text-xs);
      font-weight: var(--font-bold);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wider);
      border: var(--border-width-thin) solid;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: var(--border-radius-full);
      flex-shrink: 0;
    }

    .status-detected .status-badge {
      border-color: var(--color-info);
      color: var(--color-info);
    }
    .status-detected .status-dot {
      background: var(--color-info);
      animation: status-pulse 1.5s ease-in-out infinite alternate;
    }

    .status-impacting .status-badge {
      border-color: var(--color-danger);
      color: var(--color-danger);
      background: var(--color-danger-bg);
    }
    .status-impacting .status-dot {
      background: var(--color-danger);
      animation: status-pulse 0.8s ease-in-out infinite alternate;
    }

    .status-subsiding .status-badge {
      border-color: var(--color-warning);
      color: var(--color-warning);
    }
    .status-subsiding .status-dot {
      background: var(--color-warning);
    }

    .status-archived .status-badge {
      border-color: var(--color-border-light);
      color: var(--color-text-muted);
    }
    .status-archived .status-dot {
      background: var(--color-text-muted);
    }

    .countdown {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-secondary);
      letter-spacing: var(--tracking-wide);
      white-space: nowrap;
    }

    .countdown.urgent {
      color: var(--color-danger);
      animation: countdown-tick 1s steps(1) infinite;
    }

    /* ── Magnitude Gauge ───────────────────────────────────── */

    .magnitude {
      margin-bottom: var(--space-3);
    }

    .magnitude-label {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: var(--space-1);
    }

    .magnitude-label span {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wider);
    }

    .magnitude-value {
      font-weight: var(--font-bold);
      color: var(--color-text-primary);
    }

    .magnitude-track {
      height: 6px;
      background: var(--color-surface-sunken);
      border: var(--border-width-thin) solid var(--color-border-light);
      position: relative;
      overflow: hidden;
    }

    .magnitude-fill {
      height: 100%;
      transition: width 600ms var(--ease-dramatic);
      position: relative;
    }

    .magnitude-fill.low {
      background: linear-gradient(90deg, #06b6d4, #22d3ee);
    }
    .magnitude-fill.medium {
      background: linear-gradient(90deg, #f59e0b, #fbbf24);
    }
    .magnitude-fill.high {
      background: linear-gradient(90deg, #ef4444, #f87171);
    }

    .magnitude-fill::after {
      content: '';
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 12px;
      background: inherit;
      filter: brightness(1.3);
      animation: magnitude-pulse 2s ease-in-out infinite;
    }

    /* ── Event Type Chips ──────────────────────────────────── */

    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
      margin-bottom: var(--space-3);
    }

    .chip {
      padding: var(--space-0-5) var(--space-1-5);
      font-family: var(--font-mono);
      font-size: 0.6rem;
      text-transform: uppercase;
      letter-spacing: var(--tracking-wider);
      color: var(--color-text-secondary);
      background: var(--color-surface-sunken);
      border: var(--border-width-thin) solid var(--color-border-light);
      white-space: nowrap;
    }

    /* ── Bureau Dispatch ───────────────────────────────────── */

    .dispatch {
      border-top: var(--border-width-thin) solid var(--color-border-light);
      padding-top: var(--space-2);
    }

    .dispatch-toggle {
      display: flex;
      align-items: center;
      gap: var(--space-1-5);
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      font-family: var(--font-bureau);
      font-size: var(--text-xs);
      font-style: italic;
      color: var(--color-text-muted);
      transition: color var(--transition-fast);
      width: 100%;
      text-align: left;
    }

    .dispatch-toggle:hover {
      color: var(--color-text-secondary);
    }

    .dispatch-toggle:focus-visible {
      outline: none;
      box-shadow: var(--ring-focus);
    }

    .dispatch-chevron {
      transition: transform var(--duration-normal) var(--ease-out);
      flex-shrink: 0;
    }

    .dispatch-chevron.expanded {
      transform: rotate(90deg);
    }

    .dispatch-content {
      overflow: hidden;
      max-height: 0;
      transition: max-height var(--duration-slow) var(--ease-dramatic);
    }

    .dispatch-content.expanded {
      max-height: 600px;
    }

    .dispatch-text {
      font-family: var(--font-bureau);
      font-size: var(--text-xs);
      line-height: var(--leading-relaxed);
      color: var(--color-text-secondary);
      padding-top: var(--space-2);
      white-space: pre-wrap;
    }

    /* ── Footer ────────────────────────────────────────────── */

    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: var(--space-3);
      padding-top: var(--space-2);
      border-top: var(--border-width-thin) solid var(--color-border-light);
    }

    .impact-count {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      color: var(--color-text-secondary);
    }

    .impact-count strong {
      color: var(--color-text-primary);
    }

    .process-btn {
      padding: var(--space-1) var(--space-2);
      font-family: var(--font-brutalist);
      font-size: var(--text-xs);
      font-weight: var(--font-bold);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wider);
      color: var(--color-text-inverse);
      background: var(--color-primary);
      border: var(--border-width-default) solid var(--color-border);
      cursor: pointer;
      transition:
        background var(--transition-fast),
        transform var(--transition-fast),
        box-shadow var(--transition-fast);
    }

    .process-btn:hover {
      background: var(--color-primary-hover);
      transform: translate(-1px, -1px);
      box-shadow: var(--shadow-sm);
    }

    .process-btn:active {
      transform: translate(0);
      box-shadow: var(--shadow-pressed);
    }

    .process-btn:focus-visible {
      outline: none;
      box-shadow: var(--ring-focus);
    }

    /* ── Keyframes ─────────────────────────────────────────── */

    @keyframes card-enter {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes status-pulse {
      from { transform: scale(1); opacity: 1; }
      to { transform: scale(1.6); opacity: 0.4; }
    }

    @keyframes icon-glow {
      0%, 100% { filter: drop-shadow(0 0 2px currentColor); }
      50% { filter: drop-shadow(0 0 8px currentColor); }
    }

    @keyframes impacting-border {
      0%, 100% { border-color: var(--color-danger); }
      50% { border-color: color-mix(in srgb, var(--color-danger) 50%, transparent); }
    }

    @keyframes magnitude-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    @keyframes countdown-tick {
      50% { opacity: 0.6; }
    }

    @media (prefers-reduced-motion: reduce) {
      .card,
      .status-dot,
      .icon-wrap,
      .magnitude-fill::after,
      .countdown.urgent {
        animation: none !important;
      }
      .card {
        opacity: 1;
      }
    }
  `;

  @property({ type: Object }) resonance!: Resonance;
  @property({ type: Number }) impactCount = 0;
  @property({ type: Boolean }) showProcessButton = false;

  @state() private _dispatchExpanded = false;
  @state() private _countdown = '';
  private _countdownTimer?: ReturnType<typeof setInterval>;

  connectedCallback(): void {
    super.connectedCallback();
    this._startCountdown();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._countdownTimer) clearInterval(this._countdownTimer);
  }

  private _startCountdown(): void {
    this._updateCountdown();
    this._countdownTimer = setInterval(() => this._updateCountdown(), 1000);
  }

  private _updateCountdown(): void {
    if (!this.resonance?.impacts_at) return;
    const target = new Date(this.resonance.impacts_at).getTime();
    const diff = target - Date.now();
    if (diff <= 0) {
      this._countdown = '';
      return;
    }
    const hours = Math.floor(diff / 3_600_000);
    const mins = Math.floor((diff % 3_600_000) / 60_000);
    const secs = Math.floor((diff % 60_000) / 1000);
    this._countdown = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  private _handleClick(): void {
    this.dispatchEvent(
      new CustomEvent('resonance-click', {
        detail: this.resonance,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _handleProcess(e: Event): void {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent('resonance-process', {
        detail: this.resonance.id,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _toggleDispatch(e: Event): void {
    e.stopPropagation();
    this._dispatchExpanded = !this._dispatchExpanded;
  }

  private _getMagnitudeClass(): string {
    const m = this.resonance.magnitude;
    if (m <= 0.4) return 'low';
    if (m <= 0.7) return 'medium';
    return 'high';
  }

  private _statusLabel(status: string): string {
    switch (status) {
      case 'detected': return msg('Detected');
      case 'impacting': return msg('Impacting');
      case 'subsiding': return msg('Subsiding');
      case 'archived': return msg('Archived');
      default: return status;
    }
  }

  protected render() {
    if (!this.resonance) return nothing;

    const r = this.resonance;
    const statusClass = `status-${r.status}`;
    const magPct = Math.round(r.magnitude * 100);
    const isUrgent = r.status === 'detected' && this._countdown !== '' &&
      new Date(r.impacts_at).getTime() - Date.now() < 3_600_000;

    return html`
      <div
        class=${classMap({ card: true, [statusClass]: true })}
        tabindex="0"
        role="article"
        aria-label=${`${r.archetype ?? 'Resonance'}: ${r.title ?? 'Unknown'}`}
        @click=${this._handleClick}
        @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._handleClick(); } }}
      >
        <!-- Header -->
        <div class="header">
          <div class="icon-wrap" aria-hidden="true">
            ${icons.resonanceArchetype(r.resonance_signature, 20)}
          </div>
          <div class="title-block">
            <div class="archetype-label">
              ${ARCHETYPE_LABELS[r.resonance_signature] ?? r.archetype}
            </div>
            <div class="title">${r.title}</div>
          </div>
        </div>

        <!-- Status + Countdown -->
        <div class="meta-row">
          <span class="status-badge">
            <span class="status-dot"></span>
            ${this._statusLabel(r.status)}
          </span>
          ${this._countdown
            ? html`<span class=${classMap({ countdown: true, urgent: isUrgent })}
                aria-label=${msg('Time until impact')}
              >${this._countdown}</span>`
            : r.status === 'impacting'
              ? html`<span class="countdown urgent">${msg('IMPACTING')}</span>`
              : nothing}
        </div>

        <!-- Magnitude -->
        <div class="magnitude">
          <div class="magnitude-label">
            <span>${msg('Magnitude')}</span>
            <span class="magnitude-value">${r.magnitude.toFixed(2)}</span>
          </div>
          <div class="magnitude-track" role="meter" aria-valuenow=${magPct} aria-valuemin="0" aria-valuemax="100"
            aria-label=${msg('Tremor magnitude')}>
            <div class="magnitude-fill ${this._getMagnitudeClass()}"
              style="width: ${magPct}%"></div>
          </div>
        </div>

        <!-- Event Type Chips -->
        ${r.affected_event_types?.length
          ? html`<div class="chips" aria-label=${msg('Affected event types')}>
              ${r.affected_event_types.map(
                (t) => html`<span class="chip">${t.replace(/_/g, ' ')}</span>`,
              )}
            </div>`
          : nothing}

        <!-- Bureau Dispatch -->
        ${r.bureau_dispatch
          ? html`<div class="dispatch">
              <button class="dispatch-toggle"
                @click=${this._toggleDispatch}
                aria-expanded=${this._dispatchExpanded}
                aria-controls="dispatch-content">
                <span class="dispatch-chevron ${this._dispatchExpanded ? 'expanded' : ''}"
                  aria-hidden="true">${icons.chevronRight(10)}</span>
                ${msg('Bureau Dispatch')}
              </button>
              <div id="dispatch-content"
                class=${classMap({ 'dispatch-content': true, expanded: this._dispatchExpanded })}>
                <div class="dispatch-text">${this._dispatchExpanded
                  ? r.bureau_dispatch
                  : r.bureau_dispatch.slice(0, 120) + '...'}</div>
              </div>
            </div>`
          : nothing}

        <!-- Footer -->
        <div class="footer">
          <span class="impact-count">
            ${icons.substrateTremor(12)}
            <strong>${this.impactCount}</strong> ${msg('impacts')}
          </span>
          ${this.showProcessButton && r.status === 'detected'
            ? html`<button class="process-btn"
                @click=${this._handleProcess}
                aria-label=${msg('Process impact across simulations')}>
                ${msg('Process')}
              </button>`
            : nothing}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'resonance-card': ResonanceCard;
  }
}
