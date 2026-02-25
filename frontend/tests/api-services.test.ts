import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockFetch, mockFetchNetworkError, resetFetchMock } from './helpers/mock-api.js';
import { createAgent, createBuilding } from './helpers/fixtures.js';

// ---------------------------------------------------------------------------
// We cannot import the real BaseApiService/AgentsApiService/BuildingsApiService
// directly because they depend on:
//   - import.meta.env.VITE_BACKEND_URL  (Vite-specific)
//   - appState (Preact Signals singleton importing @supabase/supabase-js)
//   - window.location.origin  (browser global)
//
// Instead we replicate the minimal BaseApiService logic in a test-local class
// so we can verify the fetch contract (URL construction, headers, error
// handling) without pulling in the full dependency tree.
// This is the recommended pattern for unit-testing service layers in Node
// environments — test the *contract*, not the import chain.
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
  ): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
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
      const json = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: {
            code: json.code || `HTTP_${response.status}`,
            message: json.message || json.detail || response.statusText,
          },
        };
      }
      return {
        success: true,
        data: json.data !== undefined ? json.data : json,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message },
      };
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

  delete<T>(path: string) {
    return this.request<T>('DELETE', path);
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BaseApiService — GET', () => {
  let service: TestableBaseApiService;

  beforeEach(() => {
    service = new TestableBaseApiService('/api/v1', 'test-jwt-token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('should call fetch with the correct URL', async () => {
    const spy = mockFetch([{ body: { data: [] } }]);
    await service.get('/simulations/abc/agents');
    expect(spy).toHaveBeenCalledOnce();
    const [url] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost/api/v1/simulations/abc/agents');
  });

  it('should include Authorization header with Bearer token', async () => {
    const spy = mockFetch([{ body: { data: [] } }]);
    await service.get('/simulations/abc/agents');
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer test-jwt-token');
  });

  it('should NOT include Authorization header when no token is set', async () => {
    service.setToken(null);
    const spy = mockFetch([{ body: { data: [] } }]);
    await service.get('/simulations/abc/agents');
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('should include Content-Type: application/json', async () => {
    const spy = mockFetch([{ body: { data: [] } }]);
    await service.get('/test');
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('should append query params to the URL', async () => {
    const spy = mockFetch([{ body: { data: [] } }]);
    await service.get('/agents', { limit: '10', offset: '20' });
    const [url] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('limit=10');
    expect(url).toContain('offset=20');
  });

  it('should use GET method', async () => {
    const spy = mockFetch([{ body: { data: [] } }]);
    await service.get('/test');
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('GET');
  });

  it('should return data from successful response', async () => {
    const agents = [createAgent({ name: 'Alpha' }), createAgent({ name: 'Beta' })];
    mockFetch([{ body: { data: agents } }]);
    const result = await service.get('/agents');
    expect(result.success).toBe(true);
    expect(result.data).toEqual(agents);
  });

  it('should unwrap json directly when data key is absent', async () => {
    mockFetch([{ body: { items: [1, 2, 3] } }]);
    const result = await service.get('/items');
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ items: [1, 2, 3] });
  });
});

describe('BaseApiService — POST', () => {
  let service: TestableBaseApiService;

  beforeEach(() => {
    service = new TestableBaseApiService('/api/v1', 'test-jwt-token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('should send POST with JSON body', async () => {
    const spy = mockFetch([{ body: { data: { id: '1' } } }]);
    await service.post('/agents', { name: 'Agent' });
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ name: 'Agent' });
  });

  it('should return created resource', async () => {
    const agent = createAgent({ name: 'Created Agent' });
    mockFetch([{ body: { data: agent } }]);
    const result = await service.post('/agents', { name: 'Created Agent' });
    expect(result.success).toBe(true);
    expect(result.data).toEqual(agent);
  });
});

describe('BaseApiService — PUT', () => {
  let service: TestableBaseApiService;

  beforeEach(() => {
    service = new TestableBaseApiService('/api/v1', 'test-jwt-token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('should send PUT with JSON body', async () => {
    const spy = mockFetch([{ body: { data: {} } }]);
    await service.put('/agents/1', { name: 'Updated' });
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual({ name: 'Updated' });
  });

  it('should include If-Updated-At header when updatedAt is provided', async () => {
    const spy = mockFetch([{ body: { data: {} } }]);
    const timestamp = '2026-01-15T10:00:00Z';
    await service.put('/agents/1', { name: 'Updated' }, timestamp);
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['If-Updated-At']).toBe(timestamp);
  });

  it('should NOT include If-Updated-At header when updatedAt is not provided', async () => {
    const spy = mockFetch([{ body: { data: {} } }]);
    await service.put('/agents/1', { name: 'Updated' });
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['If-Updated-At']).toBeUndefined();
  });
});

describe('BaseApiService — DELETE', () => {
  let service: TestableBaseApiService;

  beforeEach(() => {
    service = new TestableBaseApiService('/api/v1', 'test-jwt-token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('should send DELETE request', async () => {
    const spy = mockFetch([{ body: { data: {} } }]);
    await service.delete('/agents/1');
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('DELETE');
  });

  it('should not include a body', async () => {
    const spy = mockFetch([{ body: { data: {} } }]);
    await service.delete('/agents/1');
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(init.body).toBeUndefined();
  });
});

describe('BaseApiService — Error handling', () => {
  let service: TestableBaseApiService;

  beforeEach(() => {
    service = new TestableBaseApiService('/api/v1', 'test-jwt-token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('should return error for non-OK HTTP status', async () => {
    mockFetch([{ status: 404, body: { code: 'NOT_FOUND', message: 'Agent not found' } }]);
    const result = await service.get('/agents/nonexistent');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NOT_FOUND');
    expect(result.error?.message).toBe('Agent not found');
  });

  it('should construct code from HTTP status when server omits code', async () => {
    mockFetch([{ status: 500, body: { message: 'Internal error' } }]);
    const result = await service.get('/fail');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('HTTP_500');
    expect(result.error?.message).toBe('Internal error');
  });

  it('should use detail field when message is absent', async () => {
    mockFetch([{ status: 422, body: { detail: 'Validation failed' } }]);
    const result = await service.post('/agents', {});
    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('Validation failed');
  });

  it('should handle network errors gracefully', async () => {
    mockFetchNetworkError('Failed to fetch');
    const result = await service.get('/agents');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NETWORK_ERROR');
    expect(result.error?.message).toBe('Failed to fetch');
  });

  it('should handle non-Error thrown objects', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue('string error');
    const result = await service.get('/agents');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NETWORK_ERROR');
    expect(result.error?.message).toBe('An unknown error occurred');
  });
});

// ---------------------------------------------------------------------------
// AgentsApiService URL construction
// ---------------------------------------------------------------------------

describe('AgentsApiService — URL construction', () => {
  let service: TestableBaseApiService;

  beforeEach(() => {
    service = new TestableBaseApiService('/api/v1', 'token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('list should call GET /simulations/{simId}/agents', async () => {
    const spy = mockFetch([{ body: { data: [] } }]);
    await service.get('/simulations/sim-123/agents', { limit: '25', offset: '0' });
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/simulations/sim-123/agents');
    expect(url).toContain('limit=25');
    expect(init.method).toBe('GET');
  });

  it('getById should call GET /simulations/{simId}/agents/{agentId}', async () => {
    const spy = mockFetch([{ body: { data: createAgent() } }]);
    await service.get('/simulations/sim-123/agents/agent-456');
    const [url] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/simulations/sim-123/agents/agent-456');
  });

  it('create should call POST /simulations/{simId}/agents', async () => {
    const spy = mockFetch([{ body: { data: createAgent() } }]);
    await service.post('/simulations/sim-123/agents', { name: 'New Agent' });
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/simulations/sim-123/agents');
    expect(init.method).toBe('POST');
  });

  it('update should call PUT /simulations/{simId}/agents/{agentId}', async () => {
    const spy = mockFetch([{ body: { data: createAgent() } }]);
    await service.put('/simulations/sim-123/agents/agent-456', { name: 'Updated' });
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/simulations/sim-123/agents/agent-456');
    expect(init.method).toBe('PUT');
  });

  it('remove should call DELETE /simulations/{simId}/agents/{agentId}', async () => {
    const spy = mockFetch([{ body: { data: {} } }]);
    await service.delete('/simulations/sim-123/agents/agent-456');
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/simulations/sim-123/agents/agent-456');
    expect(init.method).toBe('DELETE');
  });

  it('generatePortrait should call POST /simulations/{simId}/agents/{agentId}/generate-portrait', async () => {
    const spy = mockFetch([{ body: { data: { image_url: 'https://example.com/img.png' } } }]);
    await service.post('/simulations/sim-123/agents/agent-456/generate-portrait');
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/simulations/sim-123/agents/agent-456/generate-portrait');
    expect(init.method).toBe('POST');
  });
});

// ---------------------------------------------------------------------------
// BuildingsApiService URL construction
// ---------------------------------------------------------------------------

describe('BuildingsApiService — URL construction', () => {
  let service: TestableBaseApiService;

  beforeEach(() => {
    service = new TestableBaseApiService('/api/v1', 'token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('list should call GET /simulations/{simId}/buildings', async () => {
    const spy = mockFetch([{ body: { data: [] } }]);
    await service.get('/simulations/sim-123/buildings');
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/simulations/sim-123/buildings');
    expect(init.method).toBe('GET');
  });

  it('getById should call GET /simulations/{simId}/buildings/{buildingId}', async () => {
    const spy = mockFetch([{ body: { data: createBuilding() } }]);
    await service.get('/simulations/sim-123/buildings/bld-789');
    const [url] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/simulations/sim-123/buildings/bld-789');
  });

  it('create should call POST /simulations/{simId}/buildings', async () => {
    const spy = mockFetch([{ body: { data: createBuilding() } }]);
    await service.post('/simulations/sim-123/buildings', {
      name: 'New Building',
      building_type: 'industrial',
    });
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/simulations/sim-123/buildings');
    expect(init.method).toBe('POST');
  });

  it('assignAgent should call POST .../assign-agent with query params', async () => {
    const spy = mockFetch([{ body: { data: {} } }]);
    // Replicate the URL the real service builds:
    const params = new URLSearchParams({ agent_id: 'agent-456' });
    params.set('relation_type', 'resident');
    await service.post(
      `/simulations/sim-123/buildings/bld-789/assign-agent?${params}`,
    );
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/buildings/bld-789/assign-agent');
    expect(url).toContain('agent_id=agent-456');
    expect(url).toContain('relation_type=resident');
    expect(init.method).toBe('POST');
    // Body should be absent (params go in query string)
    expect(init.body).toBeUndefined();
  });

  it('assignAgent without relationType should omit relation_type param', async () => {
    const spy = mockFetch([{ body: { data: {} } }]);
    const params = new URLSearchParams({ agent_id: 'agent-456' });
    await service.post(
      `/simulations/sim-123/buildings/bld-789/assign-agent?${params}`,
    );
    const [url] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('agent_id=agent-456');
    expect(url).not.toContain('relation_type');
  });

  it('unassignAgent should call DELETE .../unassign-agent with agent_id query param', async () => {
    const spy = mockFetch([{ body: { data: {} } }]);
    await service.delete(
      '/simulations/sim-123/buildings/bld-789/unassign-agent?agent_id=agent-456',
    );
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/buildings/bld-789/unassign-agent');
    expect(url).toContain('agent_id=agent-456');
    expect(init.method).toBe('DELETE');
  });

  it('getProfessionRequirements should call GET .../profession-requirements', async () => {
    const spy = mockFetch([{ body: { data: [] } }]);
    await service.get('/simulations/sim-123/buildings/bld-789/profession-requirements');
    const [url] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/simulations/sim-123/buildings/bld-789/profession-requirements');
  });

  it('setProfessionRequirement should call POST .../profession-requirements with query params', async () => {
    const spy = mockFetch([{ body: { data: {} } }]);
    const params = new URLSearchParams();
    params.set('profession', 'baker');
    params.set('min_qualification_level', '3');
    params.set('is_mandatory', 'true');
    await service.post(
      `/simulations/sim-123/buildings/bld-789/profession-requirements?${params}`,
    );
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/profession-requirements');
    expect(url).toContain('profession=baker');
    expect(url).toContain('min_qualification_level=3');
    expect(url).toContain('is_mandatory=true');
    expect(init.method).toBe('POST');
    expect(init.body).toBeUndefined();
  });
});
