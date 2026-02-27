import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mockFetch, mockFetchNetworkError, resetFetchMock } from './helpers/mock-api.js';

// ---------------------------------------------------------------------------
// Same testable service pattern as relationship-api.test.ts — replicates the
// minimal BaseApiService logic to verify fetch contract for EmbassiesApiService.
//
// The service under test: src/services/api/EmbassiesApiService.ts
// Methods: listForSimulation, getById, getForBuilding, create, update, activate, suspend, dissolve, listAllActive
// Public routing: listForSimulation, getById, getForBuilding route to /public/* when unauthenticated
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
  ): Promise<{ success: boolean; data?: T; error?: { code: string; message: string } }> {
    try {
      const url = this.buildUrl(path, params);
      const headers = this.getHeaders();
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

  getPublic<T>(path: string, params?: Record<string, string>) {
    return this.request<T>('GET', `/public${path}`, undefined, params);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>('POST', path, body);
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>('PATCH', path, body);
  }
}

// ---------------------------------------------------------------------------
// EmbassiesApiService — listForSimulation
// ---------------------------------------------------------------------------

describe('EmbassiesApiService — listForSimulation', () => {
  let service: TestableBaseApiService;

  beforeEach(() => {
    service = new TestableBaseApiService('/api/v1', 'test-jwt-token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('should call GET /simulations/{simId}/embassies', async () => {
    const spy = mockFetch([{ body: { data: [] } }]);
    await service.get('/simulations/sim-123/embassies');
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/simulations/sim-123/embassies');
    expect(init.method).toBe('GET');
  });

  it('should include Authorization header when authenticated', async () => {
    const spy = mockFetch([{ body: { data: [] } }]);
    await service.get('/simulations/sim-123/embassies');
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer test-jwt-token');
  });

  it('should pass pagination query params', async () => {
    const spy = mockFetch([{ body: { data: [], meta: { count: 0, total: 0 } } }]);
    await service.get('/simulations/sim-123/embassies', { limit: '25', offset: '0' });
    const [url] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('limit=25');
    expect(url).toContain('offset=0');
  });

  it('should route to /public/ prefix when unauthenticated', async () => {
    service.setToken(null);
    const spy = mockFetch([{ body: { data: [] } }]);
    await service.getPublic('/simulations/sim-123/embassies');
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/v1/public/simulations/sim-123/embassies');
    expect(init.method).toBe('GET');
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('should return embassy data from successful response', async () => {
    const embassies = [
      {
        id: 'emb-1',
        building_a_id: 'bld-1',
        simulation_a_id: 'sim-123',
        building_b_id: 'bld-2',
        simulation_b_id: 'sim-456',
        status: 'active',
        connection_type: 'embassy',
      },
    ];
    mockFetch([{ body: { data: embassies } }]);
    const result = await service.get('/simulations/sim-123/embassies');
    expect(result.success).toBe(true);
    expect(result.data).toEqual(embassies);
  });
});

// ---------------------------------------------------------------------------
// EmbassiesApiService — getById
// ---------------------------------------------------------------------------

describe('EmbassiesApiService — getById', () => {
  let service: TestableBaseApiService;

  beforeEach(() => {
    service = new TestableBaseApiService('/api/v1', 'test-jwt-token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('should call GET /simulations/{simId}/embassies/{embassyId}', async () => {
    const spy = mockFetch([{ body: { data: { id: 'emb-1' } } }]);
    await service.get('/simulations/sim-123/embassies/emb-1');
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/simulations/sim-123/embassies/emb-1');
    expect(init.method).toBe('GET');
  });

  it('should route to /public/ prefix when unauthenticated', async () => {
    service.setToken(null);
    const spy = mockFetch([{ body: { data: { id: 'emb-1' } } }]);
    await service.getPublic('/simulations/sim-123/embassies/emb-1');
    const [url] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/v1/public/simulations/sim-123/embassies/emb-1');
  });

  it('should handle 404 when embassy not found', async () => {
    mockFetch([{ status: 404, body: { code: 'NOT_FOUND', message: 'Embassy not found' } }]);
    const result = await service.get('/simulations/sim-123/embassies/nonexistent');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NOT_FOUND');
  });
});

// ---------------------------------------------------------------------------
// EmbassiesApiService — getForBuilding
// ---------------------------------------------------------------------------

describe('EmbassiesApiService — getForBuilding', () => {
  let service: TestableBaseApiService;

  beforeEach(() => {
    service = new TestableBaseApiService('/api/v1', 'test-jwt-token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('should call GET /simulations/{simId}/buildings/{buildingId}/embassy', async () => {
    const spy = mockFetch([{ body: { data: { id: 'emb-1' } } }]);
    await service.get('/simulations/sim-123/buildings/bld-1/embassy');
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/simulations/sim-123/buildings/bld-1/embassy');
    expect(init.method).toBe('GET');
  });

  it('should route to /public/ prefix when unauthenticated', async () => {
    service.setToken(null);
    const spy = mockFetch([{ body: { data: null } }]);
    await service.getPublic('/simulations/sim-123/buildings/bld-1/embassy');
    const [url] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/v1/public/simulations/sim-123/buildings/bld-1/embassy');
  });

  it('should return null data when building has no embassy', async () => {
    mockFetch([{ body: { data: null } }]);
    const result = await service.get('/simulations/sim-123/buildings/bld-1/embassy');
    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// EmbassiesApiService — create
// ---------------------------------------------------------------------------

describe('EmbassiesApiService — create', () => {
  let service: TestableBaseApiService;

  beforeEach(() => {
    service = new TestableBaseApiService('/api/v1', 'test-jwt-token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('should call POST /simulations/{simId}/embassies with body', async () => {
    const body = {
      building_a_id: 'bld-1',
      simulation_a_id: 'sim-123',
      building_b_id: 'bld-2',
      simulation_b_id: 'sim-456',
      connection_type: 'embassy',
      description: 'A diplomatic link between worlds',
      bleed_vector: 'memory',
      event_propagation: true,
    };
    const spy = mockFetch([{ body: { data: { id: 'emb-new', ...body } } }]);
    await service.post('/simulations/sim-123/embassies', body);
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/simulations/sim-123/embassies');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual(body);
  });

  it('should return created embassy', async () => {
    const created = {
      id: 'emb-new',
      building_a_id: 'bld-1',
      simulation_a_id: 'sim-123',
      building_b_id: 'bld-2',
      simulation_b_id: 'sim-456',
      status: 'proposed',
      connection_type: 'embassy',
      event_propagation: false,
    };
    mockFetch([{ body: { data: created } }]);
    const result = await service.post('/simulations/sim-123/embassies', {
      building_a_id: 'bld-1',
      simulation_a_id: 'sim-123',
      building_b_id: 'bld-2',
      simulation_b_id: 'sim-456',
    });
    expect(result.success).toBe(true);
    expect(result.data).toEqual(created);
  });

  it('should include Authorization header for write operations', async () => {
    const spy = mockFetch([{ body: { data: {} } }]);
    await service.post('/simulations/sim-123/embassies', {
      building_a_id: 'bld-1',
      simulation_a_id: 'sim-123',
      building_b_id: 'bld-2',
      simulation_b_id: 'sim-456',
    });
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer test-jwt-token');
  });

  it('should handle 422 validation error', async () => {
    mockFetch([{
      status: 422,
      body: { code: 'VALIDATION_ERROR', message: 'building_b_id is required' },
    }]);
    const result = await service.post('/simulations/sim-123/embassies', {
      building_a_id: 'bld-1',
      simulation_a_id: 'sim-123',
    });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('VALIDATION_ERROR');
  });
});

// ---------------------------------------------------------------------------
// EmbassiesApiService — update
// ---------------------------------------------------------------------------

describe('EmbassiesApiService — update', () => {
  let service: TestableBaseApiService;

  beforeEach(() => {
    service = new TestableBaseApiService('/api/v1', 'test-jwt-token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('should call PATCH /simulations/{simId}/embassies/{embassyId} with body', async () => {
    const body = { description: 'Updated description', bleed_vector: 'commerce' };
    const spy = mockFetch([{ body: { data: { id: 'emb-1', ...body } } }]);
    await service.patch('/simulations/sim-123/embassies/emb-1', body);
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/simulations/sim-123/embassies/emb-1');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body as string)).toEqual(body);
  });

  it('should return updated embassy', async () => {
    const updated = {
      id: 'emb-1',
      description: 'New diplomatic purpose',
      event_propagation: true,
    };
    mockFetch([{ body: { data: updated } }]);
    const result = await service.patch('/simulations/sim-123/embassies/emb-1', {
      description: 'New diplomatic purpose',
      event_propagation: true,
    });
    expect(result.success).toBe(true);
    expect(result.data).toEqual(updated);
  });
});

// ---------------------------------------------------------------------------
// EmbassiesApiService — activate
// ---------------------------------------------------------------------------

describe('EmbassiesApiService — activate', () => {
  let service: TestableBaseApiService;

  beforeEach(() => {
    service = new TestableBaseApiService('/api/v1', 'test-jwt-token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('should call PATCH /simulations/{simId}/embassies/{embassyId}/activate', async () => {
    const spy = mockFetch([{ body: { data: { id: 'emb-1', status: 'active' } } }]);
    await service.patch('/simulations/sim-123/embassies/emb-1/activate');
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/simulations/sim-123/embassies/emb-1/activate');
    expect(init.method).toBe('PATCH');
  });

  it('should return embassy with active status', async () => {
    const activated = { id: 'emb-1', status: 'active', connection_type: 'embassy' };
    mockFetch([{ body: { data: activated } }]);
    const result = await service.patch('/simulations/sim-123/embassies/emb-1/activate');
    expect(result.success).toBe(true);
    expect(result.data).toEqual(activated);
  });
});

// ---------------------------------------------------------------------------
// EmbassiesApiService — suspend
// ---------------------------------------------------------------------------

describe('EmbassiesApiService — suspend', () => {
  let service: TestableBaseApiService;

  beforeEach(() => {
    service = new TestableBaseApiService('/api/v1', 'test-jwt-token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('should call PATCH /simulations/{simId}/embassies/{embassyId}/suspend', async () => {
    const spy = mockFetch([{ body: { data: { id: 'emb-1', status: 'suspended' } } }]);
    await service.patch('/simulations/sim-123/embassies/emb-1/suspend');
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/simulations/sim-123/embassies/emb-1/suspend');
    expect(init.method).toBe('PATCH');
  });

  it('should return embassy with suspended status', async () => {
    const suspended = { id: 'emb-1', status: 'suspended', connection_type: 'embassy' };
    mockFetch([{ body: { data: suspended } }]);
    const result = await service.patch('/simulations/sim-123/embassies/emb-1/suspend');
    expect(result.success).toBe(true);
    expect(result.data).toEqual(suspended);
  });
});

// ---------------------------------------------------------------------------
// EmbassiesApiService — dissolve
// ---------------------------------------------------------------------------

describe('EmbassiesApiService — dissolve', () => {
  let service: TestableBaseApiService;

  beforeEach(() => {
    service = new TestableBaseApiService('/api/v1', 'test-jwt-token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('should call PATCH /simulations/{simId}/embassies/{embassyId}/dissolve', async () => {
    const spy = mockFetch([{ body: { data: { id: 'emb-1', status: 'dissolved' } } }]);
    await service.patch('/simulations/sim-123/embassies/emb-1/dissolve');
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/simulations/sim-123/embassies/emb-1/dissolve');
    expect(init.method).toBe('PATCH');
  });

  it('should return embassy with dissolved status', async () => {
    const dissolved = { id: 'emb-1', status: 'dissolved', connection_type: 'embassy' };
    mockFetch([{ body: { data: dissolved } }]);
    const result = await service.patch('/simulations/sim-123/embassies/emb-1/dissolve');
    expect(result.success).toBe(true);
    expect(result.data).toEqual(dissolved);
  });

  it('should handle 404 when embassy not found', async () => {
    mockFetch([{ status: 404, body: { code: 'NOT_FOUND', message: 'Embassy not found' } }]);
    const result = await service.patch('/simulations/sim-123/embassies/nonexistent/dissolve');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NOT_FOUND');
  });
});

// ---------------------------------------------------------------------------
// EmbassiesApiService — error handling
// ---------------------------------------------------------------------------

describe('EmbassiesApiService — error handling', () => {
  let service: TestableBaseApiService;

  beforeEach(() => {
    service = new TestableBaseApiService('/api/v1', 'test-jwt-token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('should handle network errors gracefully', async () => {
    mockFetchNetworkError('Network request failed');
    const result = await service.get('/simulations/sim-123/embassies');
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NETWORK_ERROR');
    expect(result.error?.message).toBe('Network request failed');
  });

  it('should handle 422 validation errors', async () => {
    mockFetch([{
      status: 422,
      body: { detail: 'Cannot create embassy between buildings in the same simulation' },
    }]);
    const result = await service.post('/simulations/sim-123/embassies', {
      building_a_id: 'bld-1',
      simulation_a_id: 'sim-123',
      building_b_id: 'bld-2',
      simulation_b_id: 'sim-123',
    });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('HTTP_422');
  });
});

// ---------------------------------------------------------------------------
// EmbassiesApiService — listAllActive (platform-level public endpoint)
// ---------------------------------------------------------------------------

describe('EmbassiesApiService — listAllActive', () => {
  let service: TestableBaseApiService;

  beforeEach(() => {
    service = new TestableBaseApiService('/api/v1', null);
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('should call GET /public/embassies without auth', async () => {
    const spy = mockFetch([{ body: { data: [] } }]);
    await service.getPublic('/embassies');
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/v1/public/embassies');
    expect(init.method).toBe('GET');
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('should return list of active embassies', async () => {
    const embassies = [
      { id: 'emb-1', status: 'active', connection_type: 'embassy' },
      { id: 'emb-2', status: 'active', connection_type: 'trade_route' },
    ];
    mockFetch([{ body: { data: embassies } }]);
    const result = await service.getPublic('/embassies');
    expect(result.success).toBe(true);
    expect(result.data).toEqual(embassies);
  });
});
