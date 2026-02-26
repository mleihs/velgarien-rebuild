import { localized, msg } from '@lit/localize';
import { html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { appState } from '../../services/AppStateManager.js';
import { simulationsApi } from '../../services/api/index.js';
import type { Simulation, SimulationTheme } from '../../types/index.js';
import { VelgToast } from '../shared/Toast.js';
import '../shared/VelgSectionHeader.js';
import { settingsStyles } from '../shared/settings-styles.js';

function getThemeOptions(): Array<{ value: SimulationTheme; label: string }> {
  return [
    { value: 'dystopian', label: msg('Dystopian') },
    { value: 'utopian', label: msg('Utopian') },
    { value: 'fantasy', label: msg('Fantasy') },
    { value: 'scifi', label: msg('Sci-Fi') },
    { value: 'historical', label: msg('Historical') },
    { value: 'custom', label: msg('Custom') },
  ];
}

interface GeneralFormData {
  name: string;
  slug: string;
  description: string;
  theme: SimulationTheme;
}

@localized()
@customElement('velg-general-settings-panel')
export class VelgGeneralSettingsPanel extends LitElement {
  static styles = [settingsStyles];

  @property({ type: String }) simulationId = '';

  @state() private _formData: GeneralFormData = {
    name: '',
    slug: '',
    description: '',
    theme: 'dystopian',
  };

  @state() private _originalData: GeneralFormData = {
    name: '',
    slug: '',
    description: '',
    theme: 'dystopian',
  };

  @state() private _loading = true;
  @state() private _saving = false;
  @state() private _error: string | null = null;

  private get _hasChanges(): boolean {
    return (
      this._formData.name !== this._originalData.name ||
      this._formData.description !== this._originalData.description ||
      this._formData.theme !== this._originalData.theme
    );
  }

  protected willUpdate(changedProperties: Map<PropertyKey, unknown>): void {
    if (changedProperties.has('simulationId') && this.simulationId) {
      this._loadSettings();
    }
  }

  protected updated(changedProperties: Map<PropertyKey, unknown>): void {
    super.updated(changedProperties);
    const prevForm = changedProperties.get('_formData') as GeneralFormData | undefined;
    const prevOriginal = changedProperties.get('_originalData') as GeneralFormData | undefined;
    if (prevForm !== undefined || prevOriginal !== undefined) {
      this.dispatchEvent(
        new CustomEvent('unsaved-change', {
          detail: this._hasChanges,
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private async _loadSettings(): Promise<void> {
    if (!this.simulationId) return;

    this._loading = true;
    this._error = null;

    try {
      // Read from the simulations table (via appState or API)
      const sim = appState.currentSimulation.value;

      if (sim && sim.id === this.simulationId) {
        this._populateFromSimulation(sim);
      } else {
        // Fallback: fetch directly
        const response = await simulationsApi.getById(this.simulationId);
        if (response.success && response.data) {
          this._populateFromSimulation(response.data as Simulation);
        } else {
          this._error = response.error?.message ?? msg('Failed to load settings');
        }
      }
    } catch (err) {
      this._error = err instanceof Error ? err.message : msg('An unknown error occurred');
    } finally {
      this._loading = false;
    }
  }

  private _populateFromSimulation(sim: Simulation): void {
    const formData: GeneralFormData = {
      name: sim.name ?? '',
      slug: sim.slug ?? '',
      description: sim.description ?? '',
      theme: sim.theme ?? 'dystopian',
    };
    this._formData = { ...formData };
    this._originalData = { ...formData };
  }

  private _handleInput(field: keyof GeneralFormData, e: Event): void {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    this._formData = { ...this._formData, [field]: target.value };
  }

  private async _handleSave(): Promise<void> {
    if (!this._hasChanges || this._saving) return;

    this._saving = true;
    this._error = null;

    try {
      const updateData: Partial<Simulation> = {};

      if (this._formData.name !== this._originalData.name) {
        updateData.name = this._formData.name;
      }
      if (this._formData.description !== this._originalData.description) {
        updateData.description = this._formData.description;
      }
      if (this._formData.theme !== this._originalData.theme) {
        updateData.theme = this._formData.theme;
      }

      const response = await simulationsApi.update(this.simulationId, updateData);

      if (!response.success) {
        this._error = response.error?.message ?? msg('Failed to save settings');
        VelgToast.error(this._error);
        return;
      }

      // Update appState so header reflects changes immediately
      if (response.data) {
        appState.setCurrentSimulation(response.data as Simulation);
      }

      this._originalData = { ...this._formData };
      VelgToast.success(msg('General settings saved successfully.'));
      this.dispatchEvent(new CustomEvent('settings-saved', { bubbles: true, composed: true }));
    } catch (err) {
      this._error = err instanceof Error ? err.message : msg('An unknown error occurred');
      VelgToast.error(this._error);
    } finally {
      this._saving = false;
    }
  }

  protected render() {
    if (this._loading) {
      return html`<velg-loading-state message=${msg('Loading general settings...')}></velg-loading-state>`;
    }

    return html`
      <div class="settings-panel">
        <velg-section-header variant="large">${msg('General Settings')}</velg-section-header>

        ${this._error ? html`<div class="settings-panel__error">${this._error}</div>` : nothing}

        <div class="settings-form">
          <div class="settings-form__group">
            <label class="settings-form__label" for="general-name">${msg('Simulation Name')}</label>
            <input
              class="settings-form__input"
              id="general-name"
              type="text"
              placeholder=${msg('Enter simulation name...')}
              .value=${this._formData.name}
              @input=${(e: Event) => this._handleInput('name', e)}
            />
          </div>

          <div class="settings-form__group">
            <label class="settings-form__label" for="general-slug">
              ${msg('Slug')}
              <span class="settings-form__hint">${msg('(read-only, set at creation)')}</span>
            </label>
            <input
              class="settings-form__input settings-form__input--readonly"
              id="general-slug"
              type="text"
              .value=${this._formData.slug}
              readonly
            />
          </div>

          <div class="settings-form__group">
            <label class="settings-form__label" for="general-description">${msg('Description')}</label>
            <textarea
              class="settings-form__textarea"
              id="general-description"
              placeholder=${msg('Describe your simulation world...')}
              .value=${this._formData.description}
              @input=${(e: Event) => this._handleInput('description', e)}
            ></textarea>
          </div>

          <div class="settings-form__group">
            <label class="settings-form__label" for="general-theme">${msg('Theme')}</label>
            <select
              class="settings-form__select"
              id="general-theme"
              .value=${this._formData.theme}
              @change=${(e: Event) => this._handleInput('theme', e)}
            >
              ${getThemeOptions().map(
                (opt) => html`
                  <option value=${opt.value} ?selected=${this._formData.theme === opt.value}>
                    ${opt.label}
                  </option>
                `,
              )}
            </select>
          </div>
        </div>

        <div class="settings-panel__footer">
          <button
            class="settings-btn settings-btn--primary"
            @click=${this._handleSave}
            ?disabled=${!this._hasChanges || this._saving}
          >
            ${this._saving ? msg('Saving...') : msg('Save Changes')}
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'velg-general-settings-panel': VelgGeneralSettingsPanel;
  }
}
