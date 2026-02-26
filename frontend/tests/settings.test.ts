import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch, mockFetchNetworkError, resetFetchMock } from './helpers/mock-api.js';
import { createSimulation } from './helpers/fixtures.js';

// ---------------------------------------------------------------------------
// Settings tests — covers:
//   - BaseApiService error extraction (FastAPI array detail format)
//   - Settings API: load/save/upsert contract
//   - Simulations API: getById, getBySlug, update
//   - Slug resolution logic (UUID detection + slug URL rewriting)
// ---------------------------------------------------------------------------

class TestableBaseApiService {
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

  private buildUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(`${this.baseUrl}${path}`, 'http://localhost');
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }
    return url.toString();
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>,
    extraHeaders?: Record<string, string>,
  ): Promise<{
    success: boolean;
    data?: T;
    meta?: unknown;
    error?: { code: string; message: string };
  }> {
    try {
      const url = this.buildUrl(path, params);
      const headers = this.getHeaders();
      if (extraHeaders) {
        Object.assign(headers, extraHeaders);
      }
      const options: RequestInit = { method, headers };
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
          if (Array.isArray(json.detail)) {
            errorMessage =
              json.detail
                .map((d: { msg?: string }) => d.msg ?? '')
                .filter(Boolean)
                .join('; ') || errorMessage;
          } else {
            errorMessage = json.message || json.detail || errorMessage;
          }
        } catch {
          // Response body is not JSON
        }
        return {
          success: false,
          error: { code: errorCode, message: errorMessage },
        };
      }
      const json = await response.json();
      return {
        success: true,
        data: json.data !== undefined ? json.data : json,
        meta: json.meta,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message },
      };
    }
  }

  /** GET with public prefix (no auth) */
  async getPublic<T>(
    path: string,
    params?: Record<string, string>,
  ): Promise<{
    success: boolean;
    data?: T;
    meta?: unknown;
    error?: { code: string; message: string };
  }> {
    try {
      const url = this.buildUrl(`/public${path}`, params);
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        let errorCode = `HTTP_${response.status}`;
        let errorMessage = response.statusText;
        try {
          const json = await response.json();
          errorCode = json.code || errorCode;
          if (Array.isArray(json.detail)) {
            errorMessage =
              json.detail
                .map((d: { msg?: string }) => d.msg ?? '')
                .filter(Boolean)
                .join('; ') || errorMessage;
          } else {
            errorMessage = json.message || json.detail || errorMessage;
          }
        } catch {
          // Response body is not JSON
        }
        return { success: false, error: { code: errorCode, message: errorMessage } };
      }
      const json = await response.json();
      return {
        success: true,
        data: json.data !== undefined ? json.data : json,
        meta: json.meta,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      return { success: false, error: { code: 'NETWORK_ERROR', message } };
    }
  }

  get<T>(path: string, params?: Record<string, string>) {
    return this.request<T>('GET', path, undefined, params);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>('POST', path, body);
  }

  put<T>(path: string, body?: unknown, updatedAt?: string) {
    const extraHeaders = updatedAt ? { 'If-Updated-At': updatedAt } : undefined;
    return this.request<T>('PUT', path, body, undefined, extraHeaders);
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>('PATCH', path, body);
  }

  delete<T>(path: string) {
    return this.request<T>('DELETE', path);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Error Extraction
// ═══════════════════════════════════════════════════════════════════════════

describe('BaseApiService error extraction', () => {
  let api: TestableBaseApiService;

  beforeEach(() => {
    api = new TestableBaseApiService();
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('extracts message from string detail', async () => {
    mockFetch([
      { status: 403, body: { detail: 'Not authorized' } },
    ]);
    const result = await api.get('/test');
    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('Not authorized');
    expect(result.error?.code).toBe('HTTP_403');
  });

  it('extracts messages from FastAPI array detail format', async () => {
    mockFetch([
      {
        status: 422,
        body: {
          detail: [
            { msg: 'Field required', loc: ['body', 'name'] },
            { msg: 'Value too short', loc: ['body', 'slug'] },
          ],
        },
      },
    ]);
    const result = await api.get('/test');
    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('Field required; Value too short');
    expect(result.error?.code).toBe('HTTP_422');
  });

  it('handles array detail with empty msg fields', async () => {
    mockFetch([
      {
        status: 422,
        body: {
          detail: [
            { msg: '', loc: ['body', 'name'] },
            { msg: 'Only valid error' },
          ],
        },
      },
    ]);
    const result = await api.get('/test');
    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('Only valid error');
  });

  it('handles array detail with no msg fields — falls back to statusText', async () => {
    mockFetch([
      {
        status: 422,
        body: { detail: [{ type: 'missing', loc: ['body'] }] },
      },
    ]);
    const result = await api.get('/test');
    expect(result.success).toBe(false);
    // Falls back to empty string from filter/join → uses empty or HTTP status text
    expect(result.error?.code).toBe('HTTP_422');
  });

  it('prefers code from response body', async () => {
    mockFetch([
      { status: 409, body: { code: 'SLUG_CONFLICT', message: 'Slug already taken' } },
    ]);
    const result = await api.get('/test');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('SLUG_CONFLICT');
    expect(result.error?.message).toBe('Slug already taken');
  });

  it('handles non-JSON error responses gracefully', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Internal Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      }),
    );
    const result = await api.get('/test');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('HTTP_500');
    expect(result.error?.message).toBe('Internal Server Error');
  });

  it('handles network errors', async () => {
    mockFetchNetworkError('Connection refused');
    const result = await api.get('/test');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NETWORK_ERROR');
    expect(result.error?.message).toBe('Connection refused');
  });

  it('extracts array detail in getPublic too', async () => {
    mockFetch([
      {
        status: 422,
        body: {
          detail: [
            { msg: 'Missing field' },
            { msg: 'Invalid format' },
          ],
        },
      },
    ]);
    const result = await api.getPublic('/simulations');
    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('Missing field; Invalid format');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Settings API Service
// ═══════════════════════════════════════════════════════════════════════════

describe('Settings API', () => {
  let api: TestableBaseApiService;
  const SIM_ID = '40000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    api = new TestableBaseApiService('/api/v1', 'test-token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('loads settings by category', async () => {
    const settingsData = [
      { id: '1', setting_key: 'primary_model', setting_value: 'gpt-4', category: 'ai' },
      { id: '2', setting_key: 'temperature', setting_value: '0.7', category: 'ai' },
    ];
    mockFetch([{ body: { success: true, data: settingsData } }]);

    const result = await api.get(`/simulations/${SIM_ID}/settings`, { category: 'ai' });
    expect(result.success).toBe(true);
    expect(result.data).toEqual(settingsData);

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toContain('/settings');
    expect(call[0]).toContain('category=ai');
  });

  it('saves settings via upsert', async () => {
    const upsertData = {
      setting_key: 'primary_model',
      setting_value: 'claude-3',
      category: 'ai',
    };
    mockFetch([{ body: { success: true, data: { ...upsertData, id: '1' } } }]);

    const result = await api.post(`/simulations/${SIM_ID}/settings`, upsertData);
    expect(result.success).toBe(true);

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[1]?.method).toBe('POST');
    const body = JSON.parse(call[1]?.body as string);
    expect(body.setting_key).toBe('primary_model');
    expect(body.setting_value).toBe('claude-3');
  });

  it('handles empty settings list', async () => {
    mockFetch([{ body: { success: true, data: [] } }]);

    const result = await api.get(`/simulations/${SIM_ID}/settings`, { category: 'integration' });
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('handles 404 for non-existent simulation', async () => {
    mockFetch([
      { status: 404, body: { detail: 'Simulation not found' } },
    ]);

    const result = await api.get(`/simulations/${SIM_ID}/settings`, { category: 'ai' });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('HTTP_404');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Simulations API — getById, getBySlug, update
// ═══════════════════════════════════════════════════════════════════════════

describe('Simulations API', () => {
  let api: TestableBaseApiService;

  beforeEach(() => {
    api = new TestableBaseApiService('/api/v1', 'test-token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('getById fetches simulation by UUID', async () => {
    const sim = createSimulation();
    mockFetch([{ body: { success: true, data: sim } }]);

    const result = await api.get(`/simulations/${sim.id}`);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(sim);
  });

  it('getBySlug fetches simulation via public endpoint', async () => {
    const sim = createSimulation({ slug: 'speranza' });
    mockFetch([{ body: { success: true, data: sim } }]);

    const result = await api.getPublic(`/simulations/by-slug/speranza`);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(sim);

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toContain('/public/simulations/by-slug/speranza');
    // No Authorization header for public requests
    const headers = call[1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('getBySlug returns 404 for unknown slug', async () => {
    mockFetch([
      { status: 404, body: { detail: 'Simulation not found.' } },
    ]);

    const result = await api.getPublic(`/simulations/by-slug/nonexistent`);
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('HTTP_404');
    expect(result.error?.message).toBe('Simulation not found.');
  });

  it('update sends PUT with simulation data', async () => {
    const sim = createSimulation({ name: 'Updated Name' });
    mockFetch([{ body: { success: true, data: sim } }]);

    const result = await api.put(`/simulations/${sim.id}`, {
      name: 'Updated Name',
      description: 'New desc',
    });
    expect(result.success).toBe(true);

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[1]?.method).toBe('PUT');
    const body = JSON.parse(call[1]?.body as string);
    expect(body.name).toBe('Updated Name');
    expect(body.description).toBe('New desc');
  });

  it('update with If-Updated-At header for optimistic locking', async () => {
    const sim = createSimulation();
    mockFetch([{ body: { success: true, data: sim } }]);

    await api.put(`/simulations/${sim.id}`, { name: 'New' }, '2026-01-01T00:00:00Z');

    const call = vi.mocked(fetch).mock.calls[0];
    const headers = call[1]?.headers as Record<string, string>;
    expect(headers['If-Updated-At']).toBe('2026-01-01T00:00:00Z');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Slug URL Resolution
// ═══════════════════════════════════════════════════════════════════════════

describe('Slug URL resolution', () => {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  it('detects valid UUIDs', () => {
    expect(UUID_RE.test('40000000-0000-0000-0000-000000000001')).toBe(true);
    expect(UUID_RE.test('c260494d-1234-5678-9abc-def012345678')).toBe(true);
    expect(UUID_RE.test('C260494D-1234-5678-9ABC-DEF012345678')).toBe(true);
  });

  it('rejects slugs', () => {
    expect(UUID_RE.test('speranza')).toBe(false);
    expect(UUID_RE.test('station-null')).toBe(false);
    expect(UUID_RE.test('capybara-kingdom')).toBe(false);
    expect(UUID_RE.test('velgarien')).toBe(false);
    expect(UUID_RE.test('my-test-simulation-123')).toBe(false);
  });

  it('rejects malformed UUIDs', () => {
    expect(UUID_RE.test('not-a-uuid')).toBe(false);
    expect(UUID_RE.test('40000000-0000-0000-0000')).toBe(false);
    expect(UUID_RE.test('40000000000000000000000000000001')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Settings panel value tracking (BaseSettingsPanel contract)
// ═══════════════════════════════════════════════════════════════════════════

describe('Settings value tracking', () => {
  it('detects changes between original and current values', () => {
    const original: Record<string, string> = {
      primary_model: 'gpt-4',
      temperature: '0.7',
      max_tokens: '300',
    };
    const current: Record<string, string> = {
      primary_model: 'claude-3',
      temperature: '0.7',
      max_tokens: '300',
    };

    const hasChanges = Object.keys(current).some(
      (key) => current[key] !== (original[key] ?? ''),
    );
    expect(hasChanges).toBe(true);
  });

  it('detects no changes when values match', () => {
    const original: Record<string, string> = {
      primary_model: 'gpt-4',
      temperature: '0.7',
    };
    const current = { ...original };

    const hasChanges = Object.keys(current).some(
      (key) => current[key] !== (original[key] ?? ''),
    );
    expect(hasChanges).toBe(false);
  });

  it('identifies which keys changed for selective save', () => {
    const original: Record<string, string> = {
      primary_model: 'gpt-4',
      temperature: '0.7',
      max_tokens: '300',
      style_prompt: 'dark moody',
    };
    const current: Record<string, string> = {
      primary_model: 'claude-3',
      temperature: '0.7',
      max_tokens: '500',
      style_prompt: 'dark moody',
    };

    const changedKeys = Object.keys(current).filter(
      (key) => current[key] !== (original[key] ?? ''),
    );
    expect(changedKeys).toEqual(['primary_model', 'max_tokens']);
  });

  it('treats missing original keys as empty string', () => {
    const original: Record<string, string> = {};
    const current: Record<string, string> = {
      new_field: 'some value',
    };

    const hasChanges = Object.keys(current).some(
      (key) => current[key] !== (original[key] ?? ''),
    );
    expect(hasChanges).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// General settings (simulation table fields)
// ═══════════════════════════════════════════════════════════════════════════

describe('General settings (simulation table)', () => {
  let api: TestableBaseApiService;

  beforeEach(() => {
    api = new TestableBaseApiService('/api/v1', 'test-token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('loads simulation fields for general settings', async () => {
    const sim = createSimulation({
      name: 'Speranza',
      slug: 'speranza',
      description: 'A post-apocalyptic world',
      theme: 'custom',
    });
    mockFetch([{ body: { success: true, data: sim } }]);

    const result = await api.get(`/simulations/${sim.id}`);
    expect(result.success).toBe(true);

    const data = result.data as typeof sim;
    expect(data.name).toBe('Speranza');
    expect(data.slug).toBe('speranza');
    expect(data.description).toBe('A post-apocalyptic world');
    expect(data.theme).toBe('custom');
  });

  it('updates simulation via PUT (not settings upsert)', async () => {
    const sim = createSimulation({ name: 'Updated' });
    mockFetch([{ body: { success: true, data: sim } }]);

    const result = await api.put(`/simulations/${sim.id}`, {
      name: 'Updated',
      description: 'New description',
      theme: 'scifi',
    });
    expect(result.success).toBe(true);

    const call = vi.mocked(fetch).mock.calls[0];
    expect(call[0]).toContain(`/simulations/${sim.id}`);
    expect(call[1]?.method).toBe('PUT');
  });

  it('does not include slug in update payload (slug is immutable)', async () => {
    const sim = createSimulation();
    mockFetch([{ body: { success: true, data: sim } }]);

    // Simulate what GeneralSettingsPanel would send — no slug
    await api.put(`/simulations/${sim.id}`, {
      name: 'New Name',
      description: 'New desc',
      theme: 'dystopian',
    });

    const call = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(call[1]?.body as string);
    expect(body.slug).toBeUndefined();
    expect(body.name).toBe('New Name');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Design settings (preset + custom tokens)
// ═══════════════════════════════════════════════════════════════════════════

describe('Design settings API contract', () => {
  let api: TestableBaseApiService;
  const SIM_ID = '40000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    api = new TestableBaseApiService('/api/v1', 'test-token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('loads design settings by category', async () => {
    const designSettings = [
      { setting_key: 'color_primary', setting_value: '#ef4444', category: 'design' },
      { setting_key: 'color_background', setting_value: '#0a0a0a', category: 'design' },
      { setting_key: 'font_heading', setting_value: 'Oswald', category: 'design' },
    ];
    mockFetch([{ body: { success: true, data: designSettings } }]);

    const result = await api.get(`/simulations/${SIM_ID}/settings`, { category: 'design' });
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(3);
  });

  it('upserts individual design tokens', async () => {
    mockFetch([
      { body: { success: true, data: { setting_key: 'color_primary', setting_value: '#22c55e' } } },
    ]);

    const result = await api.post(`/simulations/${SIM_ID}/settings`, {
      setting_key: 'color_primary',
      setting_value: '#22c55e',
      category: 'design',
    });
    expect(result.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Integration settings (masked/encrypted fields)
// ═══════════════════════════════════════════════════════════════════════════

describe('Integration settings API contract', () => {
  let api: TestableBaseApiService;
  const SIM_ID = '40000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    api = new TestableBaseApiService('/api/v1', 'test-token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('loads integration settings (masked values)', async () => {
    const integrationSettings = [
      { setting_key: 'guardian_api_key', setting_value: '****4567', category: 'integration' },
      { setting_key: 'guardian_enabled', setting_value: 'true', category: 'integration' },
    ];
    mockFetch([{ body: { success: true, data: integrationSettings } }]);

    const result = await api.get(`/simulations/${SIM_ID}/settings`, { category: 'integration' });
    expect(result.success).toBe(true);

    const data = result.data as typeof integrationSettings;
    expect(data[0].setting_value).toBe('****4567');
  });

  it('saves section of integration settings', async () => {
    mockFetch([
      { body: { success: true, data: { setting_key: 'guardian_api_key', setting_value: '****' } } },
      { body: { success: true, data: { setting_key: 'guardian_enabled', setting_value: 'true' } } },
    ]);

    // Simulate per-section save (multiple upserts)
    const r1 = await api.post(`/simulations/${SIM_ID}/settings`, {
      setting_key: 'guardian_api_key',
      setting_value: 'new-key-12345',
      category: 'integration',
    });
    const r2 = await api.post(`/simulations/${SIM_ID}/settings`, {
      setting_key: 'guardian_enabled',
      setting_value: 'true',
      category: 'integration',
    });

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Access settings
// ═══════════════════════════════════════════════════════════════════════════

describe('Access settings API contract', () => {
  let api: TestableBaseApiService;
  const SIM_ID = '40000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    api = new TestableBaseApiService('/api/v1', 'test-token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('loads access settings', async () => {
    const accessSettings = [
      { setting_key: 'allow_registration', setting_value: 'true', category: 'access' },
      { setting_key: 'default_role', setting_value: 'viewer', category: 'access' },
      { setting_key: 'max_members', setting_value: '50', category: 'access' },
    ];
    mockFetch([{ body: { success: true, data: accessSettings } }]);

    const result = await api.get(`/simulations/${SIM_ID}/settings`, { category: 'access' });
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(3);
  });

  it('loads members list', async () => {
    const members = [
      { id: '1', user_id: 'u1', member_role: 'owner', email: 'owner@test.com' },
      { id: '2', user_id: 'u2', member_role: 'admin', email: 'admin@test.com' },
    ];
    mockFetch([{ body: { success: true, data: members } }]);

    const result = await api.get(`/simulations/${SIM_ID}/members`);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });

  it('creates invitation', async () => {
    const invitation = { id: 'inv1', email: 'new@test.com', invited_role: 'editor' };
    mockFetch([{ status: 201, body: { success: true, data: invitation } }]);

    const result = await api.post(`/simulations/${SIM_ID}/invitations`, {
      email: 'new@test.com',
      invited_role: 'editor',
    });
    expect(result.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// MembershipInfo with slug
// ═══════════════════════════════════════════════════════════════════════════

describe('MembershipInfo includes simulation_slug', () => {
  let api: TestableBaseApiService;

  beforeEach(() => {
    api = new TestableBaseApiService('/api/v1', 'test-token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('returns simulation_slug in membership data', async () => {
    const userData = {
      id: 'user-1',
      email: 'test@test.com',
      memberships: [
        {
          simulation_id: '40000000-0000-0000-0000-000000000001',
          simulation_name: 'Velgarien',
          simulation_slug: 'velgarien',
          member_role: 'owner',
        },
        {
          simulation_id: '40000000-0000-0000-0000-000000000002',
          simulation_name: 'Speranza',
          simulation_slug: 'speranza',
          member_role: 'admin',
        },
      ],
    };
    mockFetch([{ body: { success: true, data: userData } }]);

    const result = await api.get('/users/me');
    expect(result.success).toBe(true);

    const data = result.data as typeof userData;
    expect(data.memberships[0].simulation_slug).toBe('velgarien');
    expect(data.memberships[1].simulation_slug).toBe('speranza');
  });
});
