/**
 * DraftRosterPanel — Full-screen overlay for agent draft selection.
 *
 * Players pick which agents from their template simulation to bring
 * into an epoch match. Two-column layout: available roster (left)
 * and deployment lineup slots (right).
 */

import { localized, msg, str } from '@lit/localize';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { Agent, AptitudeSet, OperativeType } from '../../types/index.js';
import { icons } from '../../utils/icons.js';
import '../shared/VelgAptitudeBars.js';
import '../shared/VelgAvatar.js';

@localized()
@customElement('velg-draft-roster-panel')
export class VelgDraftRosterPanel extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    /* ── Overlay ─────────────────────────── */

    .overlay {
      position: fixed;
      inset: 0;
      z-index: var(--z-top, 9000);
      background: var(--color-gray-950, #0a0a0f);
      display: flex;
      flex-direction: column;
      opacity: 0;
      animation: overlay-in 350ms var(--ease-dramatic, cubic-bezier(0.22, 1, 0.36, 1)) forwards;
    }

    /* Tactical scanline texture */
    .overlay::after {
      content: '';
      position: fixed;
      inset: 0;
      pointer-events: none;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(255 255 255 / 0.015) 2px,
        rgba(255 255 255 / 0.015) 4px
      );
      z-index: 1;
    }

    @keyframes overlay-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .overlay__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-3) var(--space-5);
      border-bottom: 2px solid var(--color-gray-800);
      background: var(--color-gray-900);
      flex-shrink: 0;
    }

    .overlay__title {
      font-family: var(--font-brutalist);
      font-weight: var(--font-black, 900);
      font-size: var(--text-lg);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      color: var(--color-gray-100);
    }

    .overlay__close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      padding: 0;
      border: 1px solid var(--color-gray-700);
      background: transparent;
      color: var(--color-gray-400);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .overlay__close:hover {
      border-color: var(--color-gray-400);
      color: var(--color-gray-100);
      background: var(--color-gray-800);
    }

    /* ── Counter Bar ──────────────────────── */

    .counter {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-5);
      background: var(--color-gray-900);
      border-bottom: 1px solid var(--color-gray-800);
      flex-shrink: 0;
    }

    .counter__pips {
      display: flex;
      gap: var(--space-1);
    }

    .counter__pip {
      width: 20px;
      height: 8px;
      border: 1px solid var(--color-gray-700);
      transition: all var(--transition-normal);
    }

    .counter__pip--filled {
      background: var(--color-epoch-accent, #f59e0b);
      border-color: var(--color-epoch-accent, #f59e0b);
      animation: pip-fill 300ms var(--ease-spring, cubic-bezier(0.22, 1, 0.36, 1));
    }

    @keyframes pip-fill {
      0% { transform: scaleY(0.3); opacity: 0; }
      60% { transform: scaleY(1.4); }
      100% { transform: scaleY(1); opacity: 1; }
    }

    .counter__text {
      font-family: var(--font-mono, monospace);
      font-size: var(--text-xs);
      color: var(--color-gray-400);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
    }

    .counter__text--ready {
      color: var(--color-success);
    }

    /* ── Body ─────────────────────────────── */

    .body {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-5);
      padding: var(--space-5);
      flex: 1;
      overflow: hidden;
    }

    @media (max-width: 768px) {
      .body {
        grid-template-columns: 1fr;
        grid-template-rows: 1fr 1fr;
      }
    }

    /* ── Column Shared ────────────────────── */

    .column {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      overflow: hidden;
    }

    .column__title {
      font-family: var(--font-brutalist);
      font-weight: var(--font-bold);
      font-size: var(--text-xs);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      color: var(--color-gray-400);
      padding-bottom: var(--space-2);
      border-bottom: 1px solid var(--color-gray-800);
      flex-shrink: 0;
    }

    .column__scroll {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      overflow-y: auto;
      flex: 1;
      scrollbar-width: thin;
      scrollbar-color: var(--color-gray-700) transparent;
    }

    /* ── Agent Draft Card ─────────────────── */

    .draft-card {
      display: flex;
      gap: var(--space-3);
      padding: var(--space-3);
      background: var(--color-gray-900);
      border: 1px solid var(--color-gray-800);
      cursor: pointer;
      transition: all var(--transition-normal);
      opacity: 0;
      animation: card-enter 300ms var(--ease-dramatic) forwards;
      animation-delay: calc(var(--i, 0) * 40ms);
    }

    @keyframes card-enter {
      from { opacity: 0; transform: translateX(-12px); }
      to { opacity: 1; transform: translateX(0); }
    }

    .draft-card:hover {
      border-color: var(--color-epoch-accent, #f59e0b);
      background: var(--color-gray-850, #141420);
    }

    .draft-card--drafted {
      opacity: 0.35;
      cursor: default;
      pointer-events: none;
      position: relative;
    }

    .draft-card--drafted::after {
      content: 'DRAFTED';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-12deg);
      font-family: var(--font-brutalist);
      font-weight: var(--font-black, 900);
      font-size: var(--text-lg);
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--color-epoch-accent, #f59e0b);
      opacity: 0.6;
      pointer-events: none;
    }

    .draft-card__portrait {
      flex-shrink: 0;
    }

    .draft-card__info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .draft-card__name {
      font-family: var(--font-brutalist);
      font-weight: var(--font-bold);
      font-size: var(--text-sm);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      color: var(--color-gray-100);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .draft-card__snippet {
      font-size: var(--text-xs);
      color: var(--color-gray-400);
      font-style: italic;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .draft-card__bars {
      margin-top: var(--space-1);
    }

    .draft-card__best {
      font-family: var(--font-mono, monospace);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      color: var(--color-gray-400);
      margin-top: var(--space-1);
    }

    .draft-card__best-type {
      color: var(--color-epoch-accent, #f59e0b);
      font-weight: var(--font-bold);
    }

    /* ── Deployment Slots ─────────────────── */

    .slot {
      display: flex;
      gap: var(--space-3);
      padding: var(--space-3);
      border: 2px dashed var(--color-gray-800);
      min-height: 72px;
      align-items: center;
      transition: all var(--transition-normal);
      cursor: default;
    }

    .slot--empty {
      justify-content: center;
      animation: slot-idle 2s ease-in-out infinite alternate;
    }

    @keyframes slot-idle {
      from { border-color: var(--color-gray-800); }
      to { border-color: color-mix(in srgb, var(--color-epoch-accent, #f59e0b) 30%, var(--color-gray-800)); }
    }

    .slot--empty .slot__label {
      font-family: var(--font-brutalist);
      font-size: var(--text-xs);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      color: var(--color-gray-700);
    }

    .slot--filled {
      background: var(--color-gray-900);
      border: 1px solid var(--color-gray-700);
      cursor: pointer;
      animation: slot-fill 350ms var(--ease-spring, cubic-bezier(0.22, 1, 0.36, 1));
    }

    @keyframes slot-fill {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .slot--filled:hover {
      border-color: var(--color-danger);
      box-shadow: 0 0 8px color-mix(in srgb, var(--color-danger) 25%, transparent);
    }

    .slot--filled:hover .slot__remove {
      opacity: 1;
    }

    .slot__info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-0-5);
    }

    .slot__name {
      font-family: var(--font-brutalist);
      font-weight: var(--font-bold);
      font-size: var(--text-xs);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      color: var(--color-gray-200);
    }

    .slot__aptitude {
      font-family: var(--font-mono, monospace);
      font-size: 9px;
      color: var(--color-gray-400);
    }

    .slot__remove {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      padding: 0;
      background: transparent;
      border: 1px solid var(--color-gray-700);
      color: var(--color-gray-500);
      cursor: pointer;
      opacity: 0;
      transition: all var(--transition-fast);
      flex-shrink: 0;
    }

    .slot__remove:hover {
      border-color: var(--color-danger);
      color: var(--color-danger);
    }

    /* ── Team Stats ────────────────────────── */

    .stats {
      display: flex;
      gap: var(--space-4);
      padding: var(--space-2) var(--space-3);
      background: var(--color-gray-900);
      border: 1px solid var(--color-gray-800);
      flex-shrink: 0;
    }

    .stats__item {
      display: flex;
      flex-direction: column;
      gap: var(--space-0-5);
    }

    .stats__label {
      font-family: var(--font-mono, monospace);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      color: var(--color-gray-400);
    }

    .stats__value {
      font-family: var(--font-brutalist);
      font-weight: var(--font-bold);
      font-size: var(--text-xs);
      color: var(--color-gray-300);
    }

    .stats__value--strong {
      color: var(--color-success);
    }

    .stats__value--weak {
      color: var(--color-danger);
    }

    /* ── Footer ────────────────────────────── */

    .footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-5);
      border-top: 2px solid var(--color-gray-800);
      background: var(--color-gray-900);
      flex-shrink: 0;
    }

    .footer__btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-5);
      font-family: var(--font-brutalist);
      font-weight: var(--font-bold);
      font-size: var(--text-sm);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      border: 2px solid;
      cursor: pointer;
      transition: all var(--transition-normal);
    }

    .footer__btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .footer__btn--cancel {
      color: var(--color-gray-400);
      border-color: var(--color-gray-700);
      background: transparent;
    }

    .footer__btn--cancel:hover:not(:disabled) {
      border-color: var(--color-gray-400);
      background: var(--color-gray-800);
    }

    .footer__btn--lock {
      color: var(--color-gray-950);
      border-color: var(--color-epoch-accent, #f59e0b);
      background: var(--color-epoch-accent, #f59e0b);
    }

    .footer__btn--lock:hover:not(:disabled) {
      transform: translate(-2px, -2px);
      box-shadow: 4px 4px 0 var(--color-gray-700),
        0 0 20px color-mix(in srgb, var(--color-epoch-accent, #f59e0b) 30%, transparent);
    }

    .footer__btn--lock:active:not(:disabled) {
      transform: translate(0);
      box-shadow: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .overlay,
      .draft-card,
      .slot--filled,
      .slot--empty,
      .counter__pip--filled {
        animation: none;
        opacity: 1;
      }

      .overlay::after {
        display: none;
      }
    }
  `;

  @property({ type: Boolean }) open = false;
  @property({ type: Array }) agents: Agent[] = [];
  @property({ type: Number }) maxSlots = 6;
  @property({ type: Object }) aptitudeMap: Map<string, AptitudeSet> = new Map();

  @state() private _draftedIds: string[] = [];

  private _onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this._cancel();
  };

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('keydown', this._onKeyDown);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._onKeyDown);
  }

  protected willUpdate(changedProperties: Map<PropertyKey, unknown>): void {
    if (changedProperties.has('open') && this.open) {
      this._draftedIds = [];
    }
  }

  private _getBestAptitude(apt: AptitudeSet): { type: OperativeType; level: number } {
    const types: OperativeType[] = [
      'spy',
      'guardian',
      'saboteur',
      'propagandist',
      'infiltrator',
      'assassin',
    ];
    let best: OperativeType = 'spy';
    let bestLevel = 0;
    for (const t of types) {
      if (apt[t] > bestLevel) {
        bestLevel = apt[t];
        best = t;
      }
    }
    return { type: best, level: bestLevel };
  }

  private _addAgent(agentId: string): void {
    if (this._draftedIds.length >= this.maxSlots) return;
    if (this._draftedIds.includes(agentId)) return;
    this._draftedIds = [...this._draftedIds, agentId];
  }

  private _removeAgent(agentId: string): void {
    this._draftedIds = this._draftedIds.filter((id) => id !== agentId);
  }

  private _cancel(): void {
    this.dispatchEvent(new CustomEvent('draft-cancel', { bubbles: true, composed: true }));
  }

  private _lockIn(): void {
    this.dispatchEvent(
      new CustomEvent('draft-complete', {
        detail: { agentIds: this._draftedIds },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _computeStats(): { strongest: string; weakest: string; avgTotal: number } {
    if (this._draftedIds.length === 0) {
      return { strongest: '—', weakest: '—', avgTotal: 0 };
    }

    const typeTotals: Record<string, number> = {
      spy: 0,
      guardian: 0,
      saboteur: 0,
      propagandist: 0,
      infiltrator: 0,
      assassin: 0,
    };

    for (const id of this._draftedIds) {
      const apt = this.aptitudeMap.get(id);
      if (!apt) continue;
      for (const t of Object.keys(typeTotals)) {
        typeTotals[t] += apt[t as OperativeType];
      }
    }

    let strongest = 'spy';
    let weakest = 'spy';
    for (const [t, v] of Object.entries(typeTotals)) {
      if (v > typeTotals[strongest]) strongest = t;
      if (v < typeTotals[weakest]) weakest = t;
    }

    const total = Object.values(typeTotals).reduce((a, b) => a + b, 0);
    const avgTotal = Math.round(total / this._draftedIds.length);

    return { strongest, weakest, avgTotal };
  }

  protected render() {
    if (!this.open) return nothing;

    const drafted = new Set(this._draftedIds);
    const isFull = this._draftedIds.length >= this.maxSlots;
    const stats = this._computeStats();

    return html`
      <div class="overlay">
        <div class="overlay__header">
          <span class="overlay__title">${msg('Draft Roster')}</span>
          <button class="overlay__close" @click=${this._cancel} aria-label=${msg('Close')}>
            ${icons.close()}
          </button>
        </div>

        <div class="counter">
          <div class="counter__pips">
            ${Array.from(
              { length: this.maxSlots },
              (_, i) => html`
              <div class="counter__pip ${i < this._draftedIds.length ? 'counter__pip--filled' : ''}"></div>
            `,
            )}
          </div>
          <span class="counter__text ${isFull ? 'counter__text--ready' : ''}">
            ${this._draftedIds.length}/${this.maxSlots} ${msg('Agents Drafted')}
          </span>
        </div>

        <div class="body">
          <!-- Available Roster -->
          <div class="column">
            <span class="column__title">${msg('Available Roster')}</span>
            <div class="column__scroll">
              ${this.agents.map((agent, i) => {
                const isDrafted = drafted.has(agent.id);
                const apt = this.aptitudeMap.get(agent.id);
                const best = apt ? this._getBestAptitude(apt) : null;

                return html`
                  <div
                    class="draft-card ${isDrafted ? 'draft-card--drafted' : ''}"
                    style="--i: ${i}"
                    @click=${() => !isDrafted && !isFull && this._addAgent(agent.id)}
                  >
                    <velg-avatar
                      class="draft-card__portrait"
                      .src=${agent.portrait_image_url ?? ''}
                      .name=${agent.name}
                      size="sm"
                    ></velg-avatar>
                    <div class="draft-card__info">
                      <span class="draft-card__name">${agent.name}</span>
                      ${
                        agent.character
                          ? html`<span class="draft-card__snippet">${agent.character.slice(0, 80)}</span>`
                          : nothing
                      }
                      ${
                        apt
                          ? html`
                          <div class="draft-card__bars">
                            <velg-aptitude-bars
                              .aptitudes=${apt}
                              size="sm"
                            ></velg-aptitude-bars>
                          </div>
                          ${
                            best
                              ? html`<span class="draft-card__best">
                                ${msg('Best')}: <span class="draft-card__best-type">${best.type}</span> (${best.level})
                              </span>`
                              : nothing
                          }
                        `
                          : nothing
                      }
                    </div>
                  </div>
                `;
              })}
            </div>
          </div>

          <!-- Deployment Lineup -->
          <div class="column">
            <span class="column__title">${msg('Deployment Lineup')}</span>
            <div class="column__scroll">
              ${Array.from({ length: this.maxSlots }, (_, i) => {
                const agentId = this._draftedIds[i];
                const agent = agentId ? this.agents.find((a) => a.id === agentId) : null;
                const apt = agentId ? this.aptitudeMap.get(agentId) : null;
                const best = apt ? this._getBestAptitude(apt) : null;

                if (!agent) {
                  return html`
                    <div class="slot slot--empty">
                      <span class="slot__label">${msg(str`Slot ${i + 1}`)}</span>
                    </div>
                  `;
                }

                return html`
                  <div class="slot slot--filled" @click=${() => this._removeAgent(agent.id)}>
                    <velg-avatar
                      .src=${agent.portrait_image_url ?? ''}
                      .name=${agent.name}
                      size="sm"
                    ></velg-avatar>
                    <div class="slot__info">
                      <span class="slot__name">${agent.name}</span>
                      ${
                        best
                          ? html`<span class="slot__aptitude">${best.type} ${best.level}</span>`
                          : nothing
                      }
                    </div>
                    <button
                      class="slot__remove"
                      @click=${(e: MouseEvent) => {
                        e.stopPropagation();
                        this._removeAgent(agent.id);
                      }}
                      aria-label=${msg(str`Remove ${agent.name}`)}
                    >
                      ${icons.close(12)}
                    </button>
                  </div>
                `;
              })}
            </div>

            <!-- Team Stats -->
            ${
              this._draftedIds.length > 0
                ? html`
                <div class="stats">
                  <div class="stats__item">
                    <span class="stats__label">${msg('Strongest')}</span>
                    <span class="stats__value stats__value--strong">${stats.strongest}</span>
                  </div>
                  <div class="stats__item">
                    <span class="stats__label">${msg('Weakest')}</span>
                    <span class="stats__value stats__value--weak">${stats.weakest}</span>
                  </div>
                  <div class="stats__item">
                    <span class="stats__label">${msg('Avg Total')}</span>
                    <span class="stats__value">${stats.avgTotal}</span>
                  </div>
                </div>
              `
                : nothing
            }
          </div>
        </div>

        <div class="footer">
          <button class="footer__btn footer__btn--cancel" @click=${this._cancel}>
            ${msg('Cancel')}
          </button>
          <button
            class="footer__btn footer__btn--lock"
            ?disabled=${this._draftedIds.length === 0}
            @click=${this._lockIn}
          >
            ${msg('Lock In Roster')}
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'velg-draft-roster-panel': VelgDraftRosterPanel;
  }
}
