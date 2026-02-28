/**
 * EpochPresenceIndicator — compact online/offline signal lamp.
 *
 * Green pulsing dot when the simulation's player is currently online
 * in the epoch's Realtime presence channel. Gray dormant dot otherwise.
 * Tooltip shows simulation name.
 */

import { effect } from '@preact/signals-core';
import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { realtimeService } from '../../services/realtime/RealtimeService.js';
import type { PresenceUser } from '../../types/index.js';

@customElement('velg-epoch-presence')
export class VelgEpochPresenceIndicator extends LitElement {
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      vertical-align: middle;
    }

    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
      transition: background 0.3s, box-shadow 0.3s;
    }

    .dot--online {
      background: #22c55e;
      box-shadow: 0 0 4px rgba(34, 197, 94, 0.6);
      animation: pulse-online 2s ease-in-out infinite;
    }

    .dot--offline {
      background: #555;
      box-shadow: none;
    }

    @keyframes pulse-online {
      0%, 100% { box-shadow: 0 0 4px rgba(34, 197, 94, 0.6); }
      50% { box-shadow: 0 0 8px rgba(34, 197, 94, 0.9); }
    }
  `;

  @property() simulationId = '';
  @state() private _isOnline = false;
  private _disposeEffect?: () => void;

  connectedCallback() {
    super.connectedCallback();
    this._disposeEffect = effect(() => {
      const users: PresenceUser[] = realtimeService.onlineUsers.value;
      this._isOnline = users.some((u) => u.simulation_id === this.simulationId);
    });
  }

  disconnectedCallback() {
    this._disposeEffect?.();
    super.disconnectedCallback();
  }

  protected render() {
    return html`
      <span
        class="dot ${this._isOnline ? 'dot--online' : 'dot--offline'}"
        title=${this._isOnline ? 'Online' : 'Offline'}
      ></span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'velg-epoch-presence': VelgEpochPresenceIndicator;
  }
}
