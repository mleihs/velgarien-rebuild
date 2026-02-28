/**
 * Epoch Operations Board — the epoch list/grid view shown when no epoch is selected.
 *
 * Extracted from EpochCommandCenter. Shows:
 * - Active epoch dossier cards with join buttons
 * - Past epochs section
 * - COMMS sidebar (collapsible chat panel)
 * - Create new epoch card/button
 */

import { localized, msg, str } from '@lit/localize';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { appState } from '../../services/AppStateManager.js';
import { realtimeService } from '../../services/realtime/RealtimeService.js';
import type { Epoch, EpochParticipant, Simulation } from '../../types/index.js';
import './EpochChatPanel.js';

@localized()
@customElement('velg-epoch-ops-board')
export class VelgEpochOpsBoard extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    /* ── Operations Board ─────────────────── */

    .ops-board {
      max-width: var(--container-2xl, 1400px);
      margin: 0 auto;
      padding: var(--space-6);
      position: relative;
    }

    /* CRT scanline overlay on entire board */
    .ops-board::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        repeating-linear-gradient(
          0deg,
          transparent,
          transparent 3px,
          rgba(255 255 255 / 0.008) 3px,
          rgba(255 255 255 / 0.008) 4px
        );
      pointer-events: none;
      z-index: 1;
    }

    .ops-board__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: var(--space-5);
      padding-bottom: var(--space-3);
      border-bottom: 2px solid var(--color-gray-800);
      position: relative;
      animation: lobby-fade 0.6s ease-out;
    }

    .ops-board__title-block {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .ops-board__surtitle {
      font-family: var(--font-mono, monospace);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--color-gray-600);
    }

    .ops-board__title {
      font-family: var(--font-brutalist);
      font-weight: var(--font-black);
      font-size: var(--text-3xl);
      text-transform: uppercase;
      letter-spacing: var(--tracking-brutalist);
      margin: 0;
      line-height: 1;
    }

    .ops-board__create-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      font-family: var(--font-brutalist);
      font-weight: var(--font-black);
      font-size: var(--text-xs);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      color: var(--color-gray-950);
      background: var(--color-gray-100);
      border: 2px solid var(--color-gray-100);
      cursor: pointer;
      transition: all 0.2s;
    }

    .ops-board__create-btn:hover {
      transform: translate(-2px, -2px);
      box-shadow: 4px 4px 0 var(--color-gray-700);
    }

    .ops-board__create-btn:active {
      transform: translate(0);
      box-shadow: none;
    }

    /* ── Epoch Dossier Grid ───────────────── */

    .dossier-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: var(--space-4);
    }

    @media (max-width: 640px) {
      .dossier-grid {
        grid-template-columns: 1fr;
      }
    }

    /* ── Dossier Card ─────────────────────── */

    .dossier-card {
      --dossier-color: var(--color-gray-600);
      position: relative;
      display: flex;
      flex-direction: column;
      background: var(--color-gray-900);
      border: 1px solid var(--color-gray-800);
      cursor: pointer;
      transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
      overflow: hidden;
      opacity: 0;
      animation: dossier-enter 0.4s ease-out forwards;
    }

    @keyframes dossier-enter {
      from {
        opacity: 0;
        transform: translateX(-12px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .dossier-card:nth-child(1) { animation-delay: 60ms; }
    .dossier-card:nth-child(2) { animation-delay: 140ms; }
    .dossier-card:nth-child(3) { animation-delay: 220ms; }
    .dossier-card:nth-child(4) { animation-delay: 300ms; }
    .dossier-card:nth-child(5) { animation-delay: 380ms; }
    .dossier-card:nth-child(6) { animation-delay: 460ms; }

    /* Left accent bar */
    .dossier-card::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: var(--dossier-color);
      transition: width 0.2s, box-shadow 0.2s;
    }

    .dossier-card:hover {
      border-color: var(--dossier-color);
      transform: translateX(4px);
      box-shadow: -4px 0 0 var(--dossier-color), 0 0 20px rgba(0 0 0 / 0.4);
    }

    .dossier-card:hover::before {
      width: 4px;
      box-shadow: 0 0 10px var(--dossier-color);
    }

    /* Phase colors */
    .dossier-card--lobby { --dossier-color: var(--color-gray-500); }
    .dossier-card--foundation { --dossier-color: var(--color-success); }
    .dossier-card--competition { --dossier-color: var(--color-warning); }
    .dossier-card--reckoning { --dossier-color: var(--color-danger); }

    /* Running epoch border pulse */
    .dossier-card--foundation,
    .dossier-card--competition,
    .dossier-card--reckoning {
      animation: dossier-enter 0.4s ease-out forwards, dossier-pulse 4s ease-in-out 0.5s infinite;
    }

    @keyframes dossier-pulse {
      0%, 100% { box-shadow: 0 0 0 rgba(0 0 0 / 0); }
      50% { box-shadow: 0 0 16px color-mix(in srgb, var(--dossier-color) 20%, transparent); }
    }

    /* ── Dossier internals ────────────────── */

    .dossier-card__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: var(--space-4) var(--space-4) var(--space-2) calc(var(--space-4) + 3px);
    }

    .dossier-card__name {
      font-family: var(--font-brutalist);
      font-weight: var(--font-black);
      font-size: var(--text-lg);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      line-height: 1.1;
      color: var(--color-gray-100);
    }

    .dossier-card__status {
      display: flex;
      align-items: center;
      gap: var(--space-1-5);
      padding: var(--space-0-5) var(--space-2);
      border: 1px solid var(--dossier-color);
      flex-shrink: 0;
    }

    .dossier-card__dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--dossier-color);
      box-shadow: 0 0 4px var(--dossier-color);
    }

    /* Pulse on running epochs */
    .dossier-card--foundation .dossier-card__dot,
    .dossier-card--competition .dossier-card__dot,
    .dossier-card--reckoning .dossier-card__dot {
      animation: chip-dot-pulse 2s ease-in-out infinite;
    }

    @keyframes chip-dot-pulse {
      0%, 100% { box-shadow: 0 0 4px var(--dossier-color); opacity: 1; }
      50% { box-shadow: 0 0 10px var(--dossier-color); opacity: 0.6; }
    }

    .dossier-card__status-label {
      font-family: var(--font-mono, monospace);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--dossier-color);
      font-weight: 600;
    }

    /* ── Stats row ────────────────────────── */

    .dossier-card__stats {
      display: flex;
      gap: var(--space-4);
      padding: var(--space-2) var(--space-4) var(--space-3) calc(var(--space-4) + 3px);
    }

    .dossier-stat {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .dossier-stat__value {
      font-family: var(--font-brutalist);
      font-weight: var(--font-black);
      font-size: var(--text-base);
      color: var(--color-gray-200);
      line-height: 1;
    }

    .dossier-stat__label {
      font-family: var(--font-mono, monospace);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--color-gray-600);
    }

    /* ── Progress bar ─────────────────────── */

    .dossier-card__progress {
      padding: 0 var(--space-4) var(--space-3) calc(var(--space-4) + 3px);
    }

    .dossier-progress {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .dossier-progress__bar {
      flex: 1;
      height: 3px;
      background: var(--color-gray-800);
      position: relative;
      overflow: hidden;
    }

    .dossier-progress__fill {
      position: absolute;
      inset: 0;
      background: var(--dossier-color);
      transform-origin: left;
      transition: transform 0.6s ease;
    }

    .dossier-progress__text {
      font-family: var(--font-mono, monospace);
      font-size: 9px;
      color: var(--color-gray-500);
      flex-shrink: 0;
    }

    /* ── Footer / join area ───────────────── */

    .dossier-card__footer {
      margin-top: auto;
      padding: var(--space-2) var(--space-4) var(--space-3) calc(var(--space-4) + 3px);
      border-top: 1px solid var(--color-gray-800);
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex-wrap: wrap;
    }

    .dossier-join-btn {
      padding: var(--space-1) var(--space-3);
      font-family: var(--font-brutalist);
      font-weight: var(--font-bold);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      color: var(--color-success);
      background: transparent;
      border: 1px solid var(--color-success);
      cursor: pointer;
      transition: all 0.2s;
    }

    .dossier-join-btn:hover {
      background: var(--color-success);
      color: var(--color-gray-950);
    }

    .dossier-join-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .dossier-card__view-hint {
      font-family: var(--font-mono, monospace);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--color-gray-600);
      margin-left: auto;
      transition: color 0.2s;
    }

    .dossier-card:hover .dossier-card__view-hint {
      color: var(--color-gray-400);
    }

    /* ── Create New card ──────────────────── */

    .dossier-card--create {
      border-style: dashed;
      border-color: var(--color-gray-700);
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 160px;
      transition: border-color 0.2s, background 0.2s;
    }

    .dossier-card--create::before {
      display: none;
    }

    .dossier-card--create:hover {
      border-color: var(--color-gray-400);
      background: rgba(255 255 255 / 0.02);
      transform: none;
      box-shadow: none;
    }

    .dossier-create__inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
    }

    .dossier-create__plus {
      font-family: var(--font-brutalist);
      font-weight: var(--font-black);
      font-size: var(--text-3xl);
      color: var(--color-gray-600);
      line-height: 1;
      transition: color 0.2s, transform 0.2s;
    }

    .dossier-card--create:hover .dossier-create__plus {
      color: var(--color-gray-300);
      transform: scale(1.1);
    }

    .dossier-create__label {
      font-family: var(--font-mono, monospace);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--color-gray-600);
      transition: color 0.2s;
    }

    .dossier-card--create:hover .dossier-create__label {
      color: var(--color-gray-400);
    }

    /* ── No Auth banner in ops board ──────── */

    .ops-board__no-auth {
      font-family: var(--font-mono, monospace);
      font-size: var(--text-sm);
      color: var(--color-gray-600);
      text-align: center;
      padding: var(--space-8);
      border: 1px dashed var(--color-gray-800);
    }

    /* ── Past epochs section in ops board ── */

    .ops-board__section-title {
      font-family: var(--font-mono, monospace);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--color-gray-600);
      margin: var(--space-8) 0 var(--space-3);
      padding-bottom: var(--space-2);
      border-bottom: 1px solid var(--color-gray-800);
    }

    /* ── COMMS Toggle ─────────────────────── */

    .comms-toggle {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1-5);
      padding: var(--space-1-5) var(--space-3);
      font-family: var(--font-brutalist);
      font-weight: var(--font-black);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--color-gray-500);
      background: transparent;
      border: 1px solid var(--color-gray-700);
      cursor: pointer;
      transition: all 0.25s;
      position: relative;
      overflow: hidden;
    }

    .comms-toggle::before {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        color-mix(in srgb, var(--color-warning) 3%, transparent) 2px,
        color-mix(in srgb, var(--color-warning) 3%, transparent) 3px
      );
      opacity: 0;
      transition: opacity 0.3s;
    }

    .comms-toggle:hover {
      border-color: var(--color-gray-500);
      color: var(--color-gray-300);
    }

    .comms-toggle--active {
      color: var(--color-warning);
      border-color: var(--color-warning);
      box-shadow: 0 0 12px color-mix(in srgb, var(--color-warning) 20%, transparent), inset 0 0 12px color-mix(in srgb, var(--color-warning) 5%, transparent);
    }

    .comms-toggle--active::before {
      opacity: 1;
    }

    .comms-toggle__icon {
      font-size: 12px;
      transition: transform 0.3s;
    }

    .comms-toggle--active .comms-toggle__icon {
      animation: comms-pulse 2s ease-in-out infinite;
    }

    @keyframes comms-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .comms-toggle__unread {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 14px;
      height: 14px;
      padding: 0 3px;
      border-radius: 7px;
      background: var(--color-warning);
      color: var(--color-gray-950);
      font-size: 8px;
      font-weight: 900;
      letter-spacing: 0;
    }

    /* ── COMMS Panel (ops board sidebar) ── */

    .ops-board--with-comms {
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: var(--space-4);
    }

    .ops-board__main {
      min-width: 0;
    }

    .comms-sidebar {
      position: sticky;
      top: calc(var(--header-height, 56px) + var(--space-4));
      height: calc(100vh - var(--header-height, 56px) - var(--space-8));
      display: flex;
      flex-direction: column;
      border: 1px solid var(--color-gray-800);
      background: var(--color-gray-950);
      overflow: hidden;
      animation: comms-open 0.35s ease-out;
      z-index: 2;
    }

    @keyframes comms-open {
      from {
        opacity: 0;
        transform: translateX(20px);
        clip-path: inset(0 0 0 100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
        clip-path: inset(0 0 0 0);
      }
    }

    /* Scanline wash on open */
    .comms-sidebar::before {
      content: '';
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        color-mix(in srgb, var(--color-warning) 1.5%, transparent) 2px,
        color-mix(in srgb, var(--color-warning) 1.5%, transparent) 3px
      );
      pointer-events: none;
      z-index: 1;
    }

    .comms-sidebar__header {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2-5) var(--space-3);
      border-bottom: 1px solid var(--color-gray-800);
      background: color-mix(in srgb, var(--color-warning) 3%, transparent);
      flex-shrink: 0;
    }

    .comms-sidebar__signal {
      display: flex;
      align-items: flex-end;
      gap: 2px;
      height: 12px;
    }

    .comms-sidebar__bar {
      width: 3px;
      background: var(--color-warning);
      border-radius: 1px 1px 0 0;
      animation: signal-bar 1.5s ease-in-out infinite;
    }

    .comms-sidebar__bar:nth-child(1) { height: 4px; animation-delay: 0s; }
    .comms-sidebar__bar:nth-child(2) { height: 7px; animation-delay: 0.15s; }
    .comms-sidebar__bar:nth-child(3) { height: 10px; animation-delay: 0.3s; }
    .comms-sidebar__bar:nth-child(4) { height: 12px; animation-delay: 0.45s; }

    @keyframes signal-bar {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    .comms-sidebar__freq {
      font-family: var(--font-mono, monospace);
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-warning);
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .comms-sidebar__close {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: 1px solid transparent;
      color: var(--color-gray-600);
      cursor: pointer;
      font-size: 10px;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .comms-sidebar__close:hover {
      color: var(--color-gray-300);
      border-color: var(--color-gray-700);
    }

    .comms-sidebar__body {
      flex: 1;
      min-height: 0;
      position: relative;
      z-index: 2;
    }

    .comms-sidebar__body velg-epoch-chat-panel {
      height: 100%;
    }

    /* ── COMMS Empty State ───────────────── */

    .comms-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: var(--space-6);
      text-align: center;
      gap: var(--space-3);
    }

    .comms-empty__icon {
      font-size: 28px;
      opacity: 0.3;
    }

    .comms-empty__title {
      font-family: var(--font-brutalist);
      font-weight: var(--font-bold);
      font-size: var(--text-xs);
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      color: var(--color-gray-500);
    }

    .comms-empty__desc {
      font-family: var(--font-mono, monospace);
      font-size: var(--text-xs);
      color: var(--color-gray-600);
      line-height: 1.5;
    }

    /* ── Animations ────────────────────────── */

    @keyframes lobby-fade {
      from {
        opacity: 0;
        transform: translateY(16px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* ── Mobile ────────────────────────────── */

    @media (max-width: 768px) {
      .ops-board--with-comms {
        grid-template-columns: 1fr;
      }

      .comms-sidebar {
        position: relative;
        top: auto;
        height: auto;
        max-height: 50vh;
        margin-top: var(--space-4);
      }
    }

    @media (max-width: 640px) {
      .ops-board {
        padding: var(--space-4) var(--space-3);
      }

      .ops-board__header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-3);
      }

      .dossier-grid {
        grid-template-columns: 1fr;
      }
    }
  `;

  // ── Properties from parent ──────────────────────

  @property({ type: Array }) activeEpochs: Epoch[] = [];
  @property({ type: Array }) pastEpochs: Epoch[] = [];
  @property({ type: Object }) participantCounts: Record<string, number> = {};
  @property({ type: Object }) commsEpoch: Epoch | null = null;
  @property({ type: Object }) commsParticipant: EpochParticipant | null = null;

  // ── Local state ─────────────────────────────────

  @state() private _showComms = false;
  @state() private _actionLoading = false;

  // ── Render ──────────────────────────────────────

  protected render() {
    const mySims = appState.simulations.value.filter(
      (s: Simulation) => !s.simulation_type || s.simulation_type === 'template',
    );
    const isAuth = appState.isAuthenticated.value;
    const unreadTotal =
      realtimeService.unreadEpochCount.value + realtimeService.unreadTeamCount.value;

    return html`
      <div class="ops-board ${this._showComms ? 'ops-board--with-comms' : ''}">
        <div class="ops-board__main">
          <div class="ops-board__header">
            <div class="ops-board__title-block">
              <span class="ops-board__surtitle">${msg('Competitive Layer')}</span>
              <h1 class="ops-board__title">${msg('Epoch Command Center')}</h1>
            </div>
            <div style="display: flex; gap: var(--space-2); align-items: center;">
              ${
                isAuth
                  ? html`
                  <button
                    class="comms-toggle ${this._showComms ? 'comms-toggle--active' : ''}"
                    @click=${this._toggleComms}
                    aria-label=${this._showComms ? msg('Close Comms') : msg('Open Comms')}
                    aria-expanded=${this._showComms}
                  >
                    <span class="comms-toggle__icon">${'\u{1F4E1}'}</span>
                    ${msg('Comms')}
                    ${!this._showComms && unreadTotal > 0 ? html`<span class="comms-toggle__unread">${unreadTotal}</span>` : nothing}
                  </button>
                  <button class="ops-board__create-btn" @click=${this._onCreateEpoch}>
                    + ${msg('Create New Epoch')}
                  </button>
                `
                  : nothing
              }
            </div>
          </div>

          ${
            this.activeEpochs.length > 0
              ? html`
              <div class="dossier-grid">
                ${this.activeEpochs.map((e) => this._renderDossierCard(e, mySims))}
                ${
                  isAuth
                    ? html`
                  <div
                    class="dossier-card dossier-card--create"
                    @click=${this._onCreateEpoch}
                  >
                    <div class="dossier-create__inner">
                      <span class="dossier-create__plus">+</span>
                      <span class="dossier-create__label">${msg('New Epoch')}</span>
                    </div>
                  </div>
                `
                    : nothing
                }
              </div>
            `
              : html`
              <div class="dossier-grid">
                ${
                  isAuth
                    ? html`
                  <div
                    class="dossier-card dossier-card--create"
                    @click=${this._onCreateEpoch}
                  >
                    <div class="dossier-create__inner">
                      <span class="dossier-create__plus">+</span>
                      <span class="dossier-create__label">${msg('Create First Epoch')}</span>
                    </div>
                  </div>
                `
                    : html`
                  <div class="ops-board__no-auth">
                    ${msg('Sign in to create or join an epoch.')}
                  </div>
                `
                }
              </div>
            `
          }

          ${
            this.pastEpochs.length > 0
              ? html`
              <div class="ops-board__section-title">${msg('Completed Operations')}</div>
              <div class="dossier-grid">
                ${this.pastEpochs.map((epoch) => this._renderDossierCard(epoch, mySims))}
              </div>
            `
              : nothing
          }
        </div>

        ${this._showComms ? this._renderCommsPanel() : nothing}
      </div>
    `;
  }

  // ── Comms Toggle ────────────────────────────────

  private _toggleComms() {
    this._showComms = !this._showComms;
    this.dispatchEvent(
      new CustomEvent('toggle-comms', {
        detail: { open: this._showComms },
        bubbles: true,
        composed: true,
      }),
    );
  }

  // ── Comms Panel ─────────────────────────────────

  private _renderCommsPanel() {
    if (!this.commsEpoch || !this.commsParticipant) {
      return html`
        <div class="comms-sidebar">
          <div class="comms-sidebar__header">
            <span class="comms-sidebar__freq">${msg('Comms')}</span>
            <button
              class="comms-sidebar__close"
              @click=${this._toggleComms}
              aria-label=${msg('Close Comms')}
            >&times;</button>
          </div>
          <div class="comms-sidebar__body">
            <div class="comms-empty">
              <div class="comms-empty__icon">${'\u{1F4E1}'}</div>
              <div class="comms-empty__title">${msg('No Active Channel')}</div>
              <div class="comms-empty__desc">${msg('Join an epoch to access comms')}</div>
            </div>
          </div>
        </div>
      `;
    }

    return html`
      <div class="comms-sidebar">
        <div class="comms-sidebar__header">
          <div class="comms-sidebar__signal">
            <div class="comms-sidebar__bar"></div>
            <div class="comms-sidebar__bar"></div>
            <div class="comms-sidebar__bar"></div>
            <div class="comms-sidebar__bar"></div>
          </div>
          <span class="comms-sidebar__freq">${this.commsEpoch.name}</span>
          <button
            class="comms-sidebar__close"
            @click=${this._toggleComms}
            aria-label=${msg('Close Comms')}
          >&times;</button>
        </div>
        <div class="comms-sidebar__body">
          <velg-epoch-chat-panel
            .epochId=${this.commsEpoch.id}
            .mySimulationId=${this.commsParticipant.simulation_id}
            .myTeamId=${this.commsParticipant.team_id ?? ''}
            .epochStatus=${this.commsEpoch.status}
          ></velg-epoch-chat-panel>
        </div>
      </div>
    `;
  }

  // ── Dossier Card ────────────────────────────────

  private _renderDossierCard(epoch: Epoch, mySims: Simulation[]) {
    const totalCycles = epoch.config
      ? Math.floor((epoch.config.duration_days * 24) / epoch.config.cycle_hours)
      : 0;
    const progress = totalCycles > 0 ? epoch.current_cycle / totalCycles : 0;
    const pCount = this.participantCounts[epoch.id] ?? 0;
    const isCompleted = epoch.status === 'completed';
    const isLobby = epoch.status === 'lobby';

    // In lobby phase, show join buttons for all user's template sims
    // (exact participation check happens server-side on join)
    const joinable = isLobby ? mySims : [];

    return html`
      <div
        class="dossier-card dossier-card--${epoch.status}"
        @click=${() => this._onSelectEpoch(epoch)}
      >
        <div class="dossier-card__header">
          <span class="dossier-card__name">${epoch.name}</span>
          <div class="dossier-card__status">
            <span class="dossier-card__dot"></span>
            <span class="dossier-card__status-label">${epoch.status}</span>
          </div>
        </div>

        <div class="dossier-card__stats">
          <div class="dossier-stat">
            <span class="dossier-stat__value">${pCount}</span>
            <span class="dossier-stat__label">${msg('Players')}</span>
          </div>
          <div class="dossier-stat">
            <span class="dossier-stat__value">${epoch.current_cycle}/${totalCycles}</span>
            <span class="dossier-stat__label">${msg('Cycles')}</span>
          </div>
          <div class="dossier-stat">
            <span class="dossier-stat__value">${epoch.config?.cycle_hours ?? '?'}h</span>
            <span class="dossier-stat__label">${msg('Interval')}</span>
          </div>
          ${
            epoch.config
              ? html`
              <div class="dossier-stat">
                <span class="dossier-stat__value">${epoch.config.duration_days}d</span>
                <span class="dossier-stat__label">${msg('Duration')}</span>
              </div>
            `
              : nothing
          }
        </div>

        ${
          !isCompleted && totalCycles > 0
            ? html`
            <div class="dossier-card__progress">
              <div class="dossier-progress">
                <div class="dossier-progress__bar">
                  <div
                    class="dossier-progress__fill"
                    style="transform: scaleX(${Math.min(progress, 1)})"
                  ></div>
                </div>
                <span class="dossier-progress__text">${Math.round(progress * 100)}%</span>
              </div>
            </div>
          `
            : nothing
        }

        <div class="dossier-card__footer">
          ${
            isLobby && appState.isAuthenticated.value && joinable.length > 0
              ? joinable.map(
                  (sim) => html`
                  <button
                    class="dossier-join-btn"
                    ?disabled=${this._actionLoading}
                    @click=${(ev: Event) => {
                      ev.stopPropagation();
                      this._onJoinEpoch(epoch.id, sim.id);
                    }}
                  >+ ${msg(str`Join as ${sim.name}`)}</button>
                `,
                )
              : nothing
          }
          <span class="dossier-card__view-hint">${isCompleted ? msg('View Results') : msg('View Details')} &rarr;</span>
        </div>
      </div>
    `;
  }

  // ── Event Dispatchers ───────────────────────────

  private _onSelectEpoch(epoch: Epoch) {
    this.dispatchEvent(
      new CustomEvent('select-epoch', {
        detail: { epoch },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _onJoinEpoch(epochId: string, simulationId: string) {
    this.dispatchEvent(
      new CustomEvent('join-epoch', {
        detail: { epochId, simulationId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _onCreateEpoch() {
    this.dispatchEvent(
      new CustomEvent('create-epoch', {
        bubbles: true,
        composed: true,
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'velg-epoch-ops-board': VelgEpochOpsBoard;
  }
}
