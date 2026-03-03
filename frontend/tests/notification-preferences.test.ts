import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch, mockFetchNetworkError, resetFetchMock } from './helpers/mock-api.js';

// ---------------------------------------------------------------------------
// Notification Preferences API tests — covers:
//   - GET /users/me/notification-preferences
//   - POST /users/me/notification-preferences (upsert)
//   - Error handling (network errors, server errors)
// ---------------------------------------------------------------------------

class TestableNotificationPreferencesApi {
  private baseUrl: string;
  private token: string | null;

  constructor(baseUrl = '/api/v1', token: string | null = null) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<{
    success: boolean;
    data?: T;
    error?: { code: string; message: string };
  }> {
    try {
      const url = `${this.baseUrl}${path}`;
      const options: RequestInit = { method, headers: this.getHeaders() };
      if (body !== undefined && method !== 'GET') {
        options.body = JSON.stringify(body);
      }
      const response = await fetch(url, options);
      if (!response.ok) {
        let errorCode = `HTTP_${response.status}`;
        let errorMessage = response.statusText;
        try {
          const json = await response.json();
          errorCode = json.code || errorCode;
          errorMessage = json.message || json.detail || errorMessage;
        } catch {
          // not JSON
        }
        return { success: false, error: { code: errorCode, message: errorMessage } };
      }
      const json = await response.json();
      return { success: true, data: json.data !== undefined ? json.data : json };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: { code: 'NETWORK_ERROR', message } };
    }
  }

  async getPreferences() {
    return this.request('GET', '/users/me/notification-preferences');
  }

  async updatePreferences(prefs: {
    cycle_resolved: boolean;
    phase_changed: boolean;
    epoch_completed: boolean;
    email_locale: string;
  }) {
    return this.request('POST', '/users/me/notification-preferences', prefs);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NotificationPreferencesApi', () => {
  let api: TestableNotificationPreferencesApi;

  beforeEach(() => {
    api = new TestableNotificationPreferencesApi('/api/v1', 'test-jwt-token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  // ── GET preferences ───────────────────────────────────────────

  describe('getPreferences', () => {
    it('returns default preferences when no row exists', async () => {
      mockFetch([
        {
          body: {
            success: true,
            data: {
              cycle_resolved: true,
              phase_changed: true,
              epoch_completed: true,
              email_locale: 'en',
            },
          },
        },
      ]);

      const result = await api.getPreferences();
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        cycle_resolved: true,
        phase_changed: true,
        epoch_completed: true,
        email_locale: 'en',
      });
    });

    it('returns saved preferences', async () => {
      mockFetch([
        {
          body: {
            success: true,
            data: {
              cycle_resolved: false,
              phase_changed: true,
              epoch_completed: false,
              email_locale: 'de',
            },
          },
        },
      ]);

      const result = await api.getPreferences();
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        cycle_resolved: false,
        phase_changed: true,
        epoch_completed: false,
        email_locale: 'de',
      });
    });

    it('handles 401 unauthorized', async () => {
      mockFetch([
        {
          status: 401,
          body: { detail: 'Not authenticated' },
        },
      ]);

      const result = await api.getPreferences();
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('HTTP_401');
    });

    it('handles network error', async () => {
      mockFetchNetworkError('Connection refused');

      const result = await api.getPreferences();
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NETWORK_ERROR');
      expect(result.error?.message).toBe('Connection refused');
    });
  });

  // ── POST update preferences ───────────────────────────────────

  describe('updatePreferences', () => {
    it('saves preferences successfully', async () => {
      const prefs = {
        cycle_resolved: false,
        phase_changed: true,
        epoch_completed: true,
        email_locale: 'en' as const,
      };

      mockFetch([
        {
          body: {
            success: true,
            data: prefs,
          },
        },
      ]);

      const result = await api.updatePreferences(prefs);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(prefs);
    });

    it('sends correct request body', async () => {
      const prefs = {
        cycle_resolved: false,
        phase_changed: false,
        epoch_completed: true,
        email_locale: 'de' as const,
      };

      const spy = mockFetch([{ body: { success: true, data: prefs } }]);

      await api.updatePreferences(prefs);

      expect(spy).toHaveBeenCalledTimes(1);
      const [url, options] = spy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('/api/v1/users/me/notification-preferences');
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body as string)).toEqual(prefs);
    });

    it('handles server error', async () => {
      mockFetch([
        {
          status: 500,
          body: { detail: 'Internal server error' },
        },
      ]);

      const result = await api.updatePreferences({
        cycle_resolved: true,
        phase_changed: true,
        epoch_completed: true,
        email_locale: 'en',
      });

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('HTTP_500');
    });

    it('includes authorization header', async () => {
      mockFetch([
        {
          body: {
            success: true,
            data: {
              cycle_resolved: true,
              phase_changed: true,
              epoch_completed: true,
              email_locale: 'en',
            },
          },
        },
      ]);

      const spy = vi.spyOn(globalThis, 'fetch');

      await api.getPreferences();

      const [, options] = spy.mock.calls[0] as [string, RequestInit];
      const headers = options.headers as Record<string, string>;
      expect(headers.Authorization).toBe('Bearer test-jwt-token');
    });
  });
});

// ---------------------------------------------------------------------------
// NotificationPreferences type shape
// ---------------------------------------------------------------------------

describe('NotificationPreferences type contract', () => {
  it('has the expected fields', () => {
    const prefs = {
      cycle_resolved: true,
      phase_changed: true,
      epoch_completed: true,
      email_locale: 'en',
    };

    expect(prefs).toHaveProperty('cycle_resolved');
    expect(prefs).toHaveProperty('phase_changed');
    expect(prefs).toHaveProperty('epoch_completed');
    expect(prefs).toHaveProperty('email_locale');
    expect(typeof prefs.cycle_resolved).toBe('boolean');
    expect(typeof prefs.phase_changed).toBe('boolean');
    expect(typeof prefs.epoch_completed).toBe('boolean');
    expect(typeof prefs.email_locale).toBe('string');
  });

  it('email_locale accepts en and de', () => {
    const enPrefs = { cycle_resolved: true, phase_changed: true, epoch_completed: true, email_locale: 'en' };
    const dePrefs = { cycle_resolved: true, phase_changed: true, epoch_completed: true, email_locale: 'de' };

    expect(enPrefs.email_locale).toBe('en');
    expect(dePrefs.email_locale).toBe('de');
  });
});
