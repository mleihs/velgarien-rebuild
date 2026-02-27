import { localized, msg } from '@lit/localize';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { appState } from '../../services/AppStateManager.js';
import { healthApi } from '../../services/api/HealthApiService.js';
import type {
  BuildingReadiness,
  EmbassyEffectiveness,
  SimulationHealth,
  SimulationHealthDashboard,
  ZoneStability,
} from '../../types/index.js';
import { icons } from '../../utils/icons.js';
import { viewHeaderStyles } from '../shared/view-header-styles.js';

import '../shared/LoadingState.js';
import '../shared/ErrorState.js';

/**
 * Health label → CSS color token mapping.
 */
function healthColor(label: string): string {
  switch (label) {
    case 'exemplary':
      return 'var(--color-success)';
    case 'stable':
      return 'var(--color-success)';
    case 'functional':
      return 'var(--color-info, var(--color-secondary))';
    case 'unstable':
      return 'var(--color-warning, var(--color-accent))';
    case 'critical':
      return 'var(--color-danger)';
    default:
      return 'var(--color-text-muted)';
  }
}

function staffingColor(status: string): string {
  switch (status) {
    case 'operational':
      return 'var(--color-success)';
    case 'overcrowded':
      return 'var(--color-info, var(--color-secondary))';
    case 'understaffed':
      return 'var(--color-warning, var(--color-accent))';
    case 'critically_understaffed':
      return 'var(--color-danger)';
    default:
      return 'var(--color-text-muted)';
  }
}

@localized()
@customElement('velg-simulation-health-view')
export class VelgSimulationHealthView extends LitElement {
  static styles = [
    viewHeaderStyles,
    css`
      :host {
        display: block;
      }

      /* ── Overall health hero ── */

      .health-hero {
        display: flex;
        align-items: center;
        gap: var(--space-6);
        padding: var(--space-6);
        background: var(--color-surface-raised, var(--color-surface));
        border: var(--border-default);
        box-shadow: var(--shadow-md);
        margin-bottom: var(--space-6);
      }

      .health-hero__meter {
        position: relative;
        width: 100px;
        height: 100px;
        flex-shrink: 0;
      }

      .health-hero__meter svg {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
      }

      .health-hero__meter-bg {
        fill: none;
        stroke: var(--color-border, #333);
        stroke-width: 8;
      }

      .health-hero__meter-fill {
        fill: none;
        stroke-width: 8;
        stroke-linecap: round;
        transition: stroke-dashoffset 0.8s ease;
      }

      .health-hero__meter-text {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-brutalist);
        font-weight: var(--font-black);
        font-size: var(--text-xl);
      }

      .health-hero__info {
        flex: 1;
        min-width: 0;
      }

      .health-hero__title {
        font-family: var(--font-brutalist);
        font-weight: var(--font-black);
        font-size: var(--text-2xl);
        text-transform: uppercase;
        letter-spacing: var(--tracking-brutalist);
        margin: 0 0 var(--space-2);
      }

      .health-hero__label {
        font-family: var(--font-brutalist);
        font-weight: var(--font-bold);
        font-size: var(--text-lg);
        text-transform: uppercase;
        letter-spacing: var(--tracking-wide);
      }

      .health-hero__stats {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-4);
        margin-top: var(--space-3);
      }

      .health-hero__stat {
        font-family: var(--font-sans);
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
      }

      .health-hero__stat strong {
        color: var(--color-text-primary);
      }

      /* ── Grid layout ── */

      .health-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-5);
      }

      @media (max-width: 768px) {
        .health-grid {
          grid-template-columns: 1fr;
        }
        .health-hero {
          flex-direction: column;
          text-align: center;
        }
      }

      /* ── Section panels ── */

      .panel {
        background: var(--color-surface-raised, var(--color-surface));
        border: var(--border-default);
        box-shadow: var(--shadow-sm);
        padding: var(--space-5);
      }

      .panel--full {
        grid-column: 1 / -1;
      }

      .panel__header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin-bottom: var(--space-4);
      }

      .panel__title {
        font-family: var(--font-brutalist);
        font-weight: var(--font-black);
        font-size: var(--text-base);
        text-transform: uppercase;
        letter-spacing: var(--tracking-brutalist);
        margin: 0;
      }

      .panel__icon {
        display: flex;
        align-items: center;
        color: var(--color-text-muted);
      }

      /* ── Zone stability bars ── */

      .zone-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .zone-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .zone-item__name {
        font-family: var(--font-sans);
        font-size: var(--text-sm);
        font-weight: var(--font-semibold);
        min-width: 140px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .zone-item__bar {
        flex: 1;
        height: 18px;
        background: var(--color-background);
        border: 1px solid var(--color-border, #333);
        position: relative;
        overflow: hidden;
      }

      .zone-item__fill {
        height: 100%;
        transition: width 0.6s ease;
      }

      .zone-item__value {
        font-family: var(--font-brutalist);
        font-weight: var(--font-bold);
        font-size: var(--text-xs);
        text-transform: uppercase;
        letter-spacing: var(--tracking-wide);
        min-width: 60px;
        text-align: right;
      }

      .zone-item__label {
        font-family: var(--font-sans);
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        min-width: 70px;
        text-align: right;
      }

      /* ── Building readiness list ── */

      .building-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .building-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-2) 0;
        border-bottom: 1px solid color-mix(in srgb, var(--color-border, #333) 40%, transparent);
      }

      .building-item:last-child {
        border-bottom: none;
      }

      .building-item__name {
        font-family: var(--font-sans);
        font-size: var(--text-sm);
        flex: 1;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .building-item__type {
        font-family: var(--font-sans);
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        min-width: 80px;
      }

      .building-item__staffing {
        font-family: var(--font-brutalist);
        font-weight: var(--font-bold);
        font-size: var(--text-xs);
        text-transform: uppercase;
        letter-spacing: var(--tracking-wide);
        min-width: 50px;
        text-align: right;
      }

      .building-item__readiness {
        font-family: var(--font-brutalist);
        font-weight: var(--font-bold);
        font-size: var(--text-sm);
        min-width: 40px;
        text-align: right;
      }

      .building-item__indicator {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      /* ── Diplomacy ── */

      .diplo-stats {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .diplo-stat {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: var(--font-sans);
        font-size: var(--text-sm);
      }

      .diplo-stat__label {
        color: var(--color-text-secondary);
      }

      .diplo-stat__value {
        font-family: var(--font-brutalist);
        font-weight: var(--font-bold);
      }

      .embassy-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-2) 0;
        border-bottom: 1px solid color-mix(in srgb, var(--color-border, #333) 40%, transparent);
      }

      .embassy-item:last-child {
        border-bottom: none;
      }

      .embassy-item__dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .embassy-item__sims {
        flex: 1;
        font-family: var(--font-sans);
        font-size: var(--text-sm);
      }

      .embassy-item__vector {
        font-family: var(--font-sans);
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: var(--tracking-wide);
      }

      .embassy-item__score {
        font-family: var(--font-brutalist);
        font-weight: var(--font-bold);
        font-size: var(--text-sm);
        min-width: 40px;
        text-align: right;
      }

      /* ── Bleed activity ── */

      .bleed-stats {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      /* ── Events list ── */

      .event-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .event-item {
        display: flex;
        align-items: flex-start;
        gap: var(--space-3);
        padding: var(--space-2) 0;
        border-bottom: 1px solid color-mix(in srgb, var(--color-border, #333) 40%, transparent);
      }

      .event-item:last-child {
        border-bottom: none;
      }

      .event-item__impact {
        font-family: var(--font-brutalist);
        font-weight: var(--font-black);
        font-size: var(--text-sm);
        color: var(--color-danger);
        flex-shrink: 0;
        min-width: 24px;
      }

      .event-item__info {
        flex: 1;
        min-width: 0;
      }

      .event-item__title {
        font-family: var(--font-sans);
        font-size: var(--text-sm);
        font-weight: var(--font-semibold);
      }

      .event-item__meta {
        font-family: var(--font-sans);
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        margin-top: 2px;
      }

      /* ── Empty state ── */

      .panel__empty {
        font-family: var(--font-sans);
        font-size: var(--text-sm);
        color: var(--color-text-muted);
        text-align: center;
        padding: var(--space-4);
      }

      /* ── Refresh button ── */

      .refresh-btn {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-4);
        font-family: var(--font-brutalist);
        font-weight: var(--font-bold);
        font-size: var(--text-xs);
        text-transform: uppercase;
        letter-spacing: var(--tracking-wide);
        background: transparent;
        color: var(--color-text-secondary);
        border: 1px solid var(--color-border, #333);
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .refresh-btn:hover {
        color: var(--color-primary);
        border-color: var(--color-primary);
      }
    `,
  ];

  @property({ type: String }) simulationId = '';
  @state() private _loading = true;
  @state() private _error: string | null = null;
  @state() private _dashboard: SimulationHealthDashboard | null = null;
  @state() private _refreshing = false;

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    await this._load();
  }

  private async _load(): Promise<void> {
    this._loading = true;
    this._error = null;
    try {
      const result = await healthApi.getDashboard(this.simulationId);
      if (result.success && result.data) {
        this._dashboard = result.data;
      } else {
        this._error = result.error?.message ?? msg('Failed to load health data.');
      }
    } catch (err) {
      this._error = err instanceof Error ? err.message : msg('An unexpected error occurred.');
    } finally {
      this._loading = false;
    }
  }

  private async _handleRefresh(): Promise<void> {
    if (this._refreshing || !appState.canAdmin.value) return;
    this._refreshing = true;
    try {
      await healthApi.refreshMetrics(this.simulationId);
      await this._load();
    } finally {
      this._refreshing = false;
    }
  }

  protected render() {
    if (this._loading) {
      return html`<velg-loading-state message=${msg('Loading health data...')}></velg-loading-state>`;
    }
    if (this._error) {
      return html`<velg-error-state message=${this._error}></velg-error-state>`;
    }
    if (!this._dashboard) return nothing;

    const { health, zones, buildings, embassies, recent_high_impact_events } = this._dashboard;

    return html`
      <div class="view">
        <div class="view__header">
          <h1 class="view__title">${msg('Simulation Health')}</h1>
          ${
            appState.canAdmin.value
              ? html`
                <button
                  class="refresh-btn"
                  ?disabled=${this._refreshing}
                  @click=${this._handleRefresh}
                >
                  ${icons.sparkle(12)}
                  ${this._refreshing ? msg('Refreshing...') : msg('Refresh Metrics')}
                </button>
              `
              : nothing
          }
        </div>

        ${this._renderHero(health)}

        <div class="health-grid">
          ${this._renderZonePanel(zones)}
          ${this._renderStaffingPanel(health, buildings)}
          ${this._renderDiplomacyPanel(health, embassies)}
          ${this._renderBleedPanel(health)}
          ${this._renderEventsPanel(recent_high_impact_events)}
        </div>
      </div>
    `;
  }

  private _renderHero(h: SimulationHealth) {
    const pct = Math.round(h.overall_health * 100);
    const color = healthColor(h.health_label);
    const circumference = 2 * Math.PI * 40;
    const dashoffset = circumference * (1 - h.overall_health);

    return html`
      <div class="health-hero">
        <div class="health-hero__meter">
          <svg viewBox="0 0 100 100">
            <circle class="health-hero__meter-bg" cx="50" cy="50" r="40" />
            <circle
              class="health-hero__meter-fill"
              cx="50" cy="50" r="40"
              stroke=${color}
              stroke-dasharray=${circumference}
              stroke-dashoffset=${dashoffset}
            />
          </svg>
          <span class="health-hero__meter-text" style="color: ${color}">${pct}</span>
        </div>
        <div class="health-hero__info">
          <h2 class="health-hero__title">${h.simulation_name}</h2>
          <span class="health-hero__label" style="color: ${color}">
            ${h.health_label.toUpperCase()}
          </span>
          <div class="health-hero__stats">
            <span class="health-hero__stat">
              <strong>${h.zone_count}</strong> ${msg('zones')}
            </span>
            <span class="health-hero__stat">
              <strong>${h.building_count}</strong> ${msg('buildings')}
            </span>
            <span class="health-hero__stat">
              <strong>${h.total_agents_assigned}</strong> / ${h.total_capacity} ${msg('agents')}
            </span>
            <span class="health-hero__stat">
              <strong>${h.active_embassy_count}</strong> ${msg('embassies')}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  private _renderZonePanel(zones: ZoneStability[]) {
    return html`
      <div class="panel">
        <div class="panel__header">
          <span class="panel__icon">${icons.mapPin(16)}</span>
          <h3 class="panel__title">${msg('Zone Stability')}</h3>
        </div>
        ${
          zones.length === 0
            ? html`<div class="panel__empty">${msg('No zones found.')}</div>`
            : html`
              <div class="zone-list">
                ${zones.map(
                  (z) => html`
                    <div class="zone-item">
                      <span class="zone-item__name">${z.zone_name}</span>
                      <div class="zone-item__bar">
                        <div
                          class="zone-item__fill"
                          style="width: ${Math.round(z.stability * 100)}%; background: ${healthColor(z.stability_label)}"
                        ></div>
                      </div>
                      <span class="zone-item__value" style="color: ${healthColor(z.stability_label)}">
                        ${(z.stability * 100).toFixed(0)}%
                      </span>
                      <span class="zone-item__label">${z.stability_label}</span>
                    </div>
                  `,
                )}
              </div>
            `
        }
      </div>
    `;
  }

  private _renderStaffingPanel(health: SimulationHealth, buildings: BuildingReadiness[]) {
    const critical = buildings.filter((b) => b.staffing_status === 'critically_understaffed');
    const overcrowded = buildings.filter((b) => b.staffing_status === 'overcrowded');

    return html`
      <div class="panel">
        <div class="panel__header">
          <span class="panel__icon">${icons.building(16)}</span>
          <h3 class="panel__title">${msg('Staffing Overview')}</h3>
        </div>
        <div class="diplo-stats" style="margin-bottom: var(--space-4)">
          <div class="diplo-stat">
            <span class="diplo-stat__label">${msg('Avg Readiness')}</span>
            <span class="diplo-stat__value">${(health.avg_readiness * 100).toFixed(0)}%</span>
          </div>
          <div class="diplo-stat">
            <span class="diplo-stat__label">${msg('Critical')}</span>
            <span class="diplo-stat__value" style="color: var(--color-danger)">
              ${health.critically_understaffed_buildings}
            </span>
          </div>
          <div class="diplo-stat">
            <span class="diplo-stat__label">${msg('Overcrowded')}</span>
            <span class="diplo-stat__value" style="color: var(--color-info, var(--color-secondary))">
              ${health.overcrowded_buildings}
            </span>
          </div>
        </div>
        ${
          critical.length > 0
            ? html`
              <div class="building-list">
                ${critical.slice(0, 8).map(
                  (b) => html`
                    <div class="building-item">
                      <span
                        class="building-item__indicator"
                        style="background: ${staffingColor(b.staffing_status)}"
                      ></span>
                      <span class="building-item__name">${b.building_name}</span>
                      <span class="building-item__type">${b.building_type ?? ''}</span>
                      <span
                        class="building-item__staffing"
                        style="color: ${staffingColor(b.staffing_status)}"
                      >
                        ${Math.round(b.staffing_ratio * 100)}%
                      </span>
                    </div>
                  `,
                )}
              </div>
            `
            : nothing
        }
        ${
          overcrowded.length > 0
            ? html`
              <div class="building-list" style="margin-top: var(--space-3)">
                ${overcrowded.slice(0, 4).map(
                  (b) => html`
                    <div class="building-item">
                      <span
                        class="building-item__indicator"
                        style="background: ${staffingColor(b.staffing_status)}"
                      ></span>
                      <span class="building-item__name">${b.building_name}</span>
                      <span class="building-item__type">${b.building_type ?? ''}</span>
                      <span
                        class="building-item__staffing"
                        style="color: ${staffingColor(b.staffing_status)}"
                      >
                        ${Math.round(b.staffing_ratio * 100)}%
                      </span>
                    </div>
                  `,
                )}
              </div>
            `
            : nothing
        }
      </div>
    `;
  }

  private _renderDiplomacyPanel(health: SimulationHealth, embassies: EmbassyEffectiveness[]) {
    return html`
      <div class="panel">
        <div class="panel__header">
          <span class="panel__icon">${icons.brain(16)}</span>
          <h3 class="panel__title">${msg('Diplomacy')}</h3>
        </div>
        <div class="diplo-stats">
          <div class="diplo-stat">
            <span class="diplo-stat__label">${msg('Diplomatic Reach')}</span>
            <span class="diplo-stat__value">${health.diplomatic_reach.toFixed(2)}</span>
          </div>
          <div class="diplo-stat">
            <span class="diplo-stat__label">${msg('Active Embassies')}</span>
            <span class="diplo-stat__value">${health.active_embassy_count}</span>
          </div>
          <div class="diplo-stat">
            <span class="diplo-stat__label">${msg('Avg Effectiveness')}</span>
            <span class="diplo-stat__value">
              ${(health.avg_embassy_effectiveness * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        ${
          embassies.length > 0
            ? html`
              <div style="margin-top: var(--space-4)">
                ${embassies.map((e) => {
                  const color = healthColor(e.effectiveness_label);
                  return html`
                    <div class="embassy-item">
                      <span class="embassy-item__dot" style="background: ${color}"></span>
                      <span class="embassy-item__sims">
                        ${e.bleed_vector ?? msg('general')}
                      </span>
                      <span class="embassy-item__vector">${e.effectiveness_label}</span>
                      <span class="embassy-item__score" style="color: ${color}">
                        ${(e.effectiveness * 100).toFixed(0)}%
                      </span>
                    </div>
                  `;
                })}
              </div>
            `
            : nothing
        }
      </div>
    `;
  }

  private _renderBleedPanel(health: SimulationHealth) {
    return html`
      <div class="panel">
        <div class="panel__header">
          <span class="panel__icon">${icons.sparkle(16)}</span>
          <h3 class="panel__title">${msg('Bleed Activity')}</h3>
        </div>
        <div class="bleed-stats">
          <div class="diplo-stat">
            <span class="diplo-stat__label">${msg('Permeability')}</span>
            <span class="diplo-stat__value">${(health.bleed_permeability * 100).toFixed(0)}%</span>
          </div>
          <div class="diplo-stat">
            <span class="diplo-stat__label">${msg('Outbound Echoes')}</span>
            <span class="diplo-stat__value">${health.outbound_echoes}</span>
          </div>
          <div class="diplo-stat">
            <span class="diplo-stat__label">${msg('Inbound Echoes')}</span>
            <span class="diplo-stat__value">${health.inbound_echoes}</span>
          </div>
          <div class="diplo-stat">
            <span class="diplo-stat__label">${msg('Avg Outbound Strength')}</span>
            <span class="diplo-stat__value">
              ${(health.avg_outbound_strength * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    `;
  }

  private _renderEventsPanel(events: Record<string, unknown>[]) {
    return html`
      <div class="panel panel--full">
        <div class="panel__header">
          <span class="panel__icon">${icons.bolt(16)}</span>
          <h3 class="panel__title">${msg('Recent High-Impact Events')}</h3>
        </div>
        ${
          events.length === 0
            ? html`<div class="panel__empty">${msg('No recent high-impact events.')}</div>`
            : html`
              <div class="event-list">
                ${events.map((e) => {
                  const title = (e.title as string) ?? msg('Unknown event');
                  const impact = (e.impact_level as number) ?? 0;
                  const location = (e.location as string) ?? '';
                  const eventType = (e.event_type as string) ?? '';
                  return html`
                    <div class="event-item">
                      <span class="event-item__impact">${impact}</span>
                      <div class="event-item__info">
                        <div class="event-item__title">${title}</div>
                        <div class="event-item__meta">
                          ${eventType}${location ? ` · ${location}` : ''}
                        </div>
                      </div>
                    </div>
                  `;
                })}
              </div>
            `
        }
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'velg-simulation-health-view': VelgSimulationHealthView;
  }
}
