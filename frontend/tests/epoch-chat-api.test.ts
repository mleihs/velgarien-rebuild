import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mockFetch, resetFetchMock } from './helpers/mock-api.js';

// ---------------------------------------------------------------------------
// Testable service replicating BaseApiService for EpochChatApiService contract.
// ---------------------------------------------------------------------------

class TestableBaseApiService {
  private baseUrl: string;
  private token: string | null;

  constructor(baseUrl = '/api/v1', token: string | null = null) {
    this.baseUrl = baseUrl;
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

  post<T>(path: string, body?: unknown) {
    return this.request<T>('POST', path, body);
  }
}

// ---------------------------------------------------------------------------
// sendMessage
// ---------------------------------------------------------------------------

describe('EpochChatApiService — sendMessage', () => {
  let service: TestableBaseApiService;

  beforeEach(() => {
    service = new TestableBaseApiService('/api/v1', 'test-jwt-token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('should call POST /epochs/{id}/chat with body', async () => {
    const body = {
      content: 'Hello world',
      channel_type: 'epoch',
      simulation_id: 'sim-123',
    };
    const spy = mockFetch([{ body: { data: { id: 'msg-1', ...body } } }]);
    await service.post('/epochs/epoch-1/chat', body);
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/epochs/epoch-1/chat');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual(body);
  });

  it('should return created message', async () => {
    const msg = { id: 'msg-1', content: 'Test', channel_type: 'epoch', sender_name: 'Velgarien' };
    mockFetch([{ body: { data: msg } }]);
    const result = await service.post('/epochs/epoch-1/chat', { content: 'Test' });
    expect(result.success).toBe(true);
    expect(result.data).toEqual(msg);
  });

  it('should include Authorization header', async () => {
    const spy = mockFetch([{ body: { data: {} } }]);
    await service.post('/epochs/epoch-1/chat', { content: 'Test' });
    const [, init] = spy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer test-jwt-token');
  });

  it('should handle 400 error', async () => {
    mockFetch([{ status: 400, body: { code: 'BAD_REQUEST', message: 'Epoch completed' } }]);
    const result = await service.post('/epochs/epoch-1/chat', { content: 'Test' });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('BAD_REQUEST');
  });
});

// ---------------------------------------------------------------------------
// listMessages
// ---------------------------------------------------------------------------

describe('EpochChatApiService — listMessages', () => {
  let service: TestableBaseApiService;

  beforeEach(() => {
    service = new TestableBaseApiService('/api/v1', 'test-jwt-token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('should call GET /epochs/{id}/chat', async () => {
    const spy = mockFetch([{ body: { data: [], meta: { count: 0, total: 0 } } }]);
    await service.get('/epochs/epoch-1/chat');
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/epochs/epoch-1/chat');
    expect(init.method).toBe('GET');
  });

  it('should pass pagination params', async () => {
    const spy = mockFetch([{ body: { data: [], meta: { count: 0, total: 0 } } }]);
    await service.get('/epochs/epoch-1/chat', { limit: '50', before: '2026-02-28T12:00:00Z' });
    const [url] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('limit=50');
    expect(url).toContain('before=');
  });

  it('should return messages array', async () => {
    const messages = [
      { id: 'msg-1', content: 'Hello', sender_name: 'Velgarien' },
      { id: 'msg-2', content: 'Hi back', sender_name: 'Capybara' },
    ];
    mockFetch([{ body: { data: messages, meta: { count: 2, total: 2 } } }]);
    const result = await service.get('/epochs/epoch-1/chat');
    expect(result.success).toBe(true);
    expect(result.data).toEqual(messages);
  });
});

// ---------------------------------------------------------------------------
// listTeamMessages
// ---------------------------------------------------------------------------

describe('EpochChatApiService — listTeamMessages', () => {
  let service: TestableBaseApiService;

  beforeEach(() => {
    service = new TestableBaseApiService('/api/v1', 'test-jwt-token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('should call GET /epochs/{id}/chat/team/{tid}', async () => {
    const spy = mockFetch([{ body: { data: [], meta: { count: 0, total: 0 } } }]);
    await service.get('/epochs/epoch-1/chat/team/team-1');
    const [url] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/epochs/epoch-1/chat/team/team-1');
  });
});

// ---------------------------------------------------------------------------
// setReady
// ---------------------------------------------------------------------------

describe('EpochChatApiService — setReady', () => {
  let service: TestableBaseApiService;

  beforeEach(() => {
    service = new TestableBaseApiService('/api/v1', 'test-jwt-token');
  });

  afterEach(() => {
    resetFetchMock();
  });

  it('should call POST /epochs/{id}/ready with body', async () => {
    const body = { simulation_id: 'sim-123', ready: true };
    const spy = mockFetch([{ body: { data: { cycle_ready: true } } }]);
    await service.post('/epochs/epoch-1/ready', body);
    const [url, init] = spy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/epochs/epoch-1/ready');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual(body);
  });

  it('should handle toggle to false', async () => {
    const body = { simulation_id: 'sim-123', ready: false };
    mockFetch([{ body: { data: { cycle_ready: false } } }]);
    const result = await service.post('/epochs/epoch-1/ready', body);
    expect(result.success).toBe(true);
  });

  it('should handle 404 for non-participant', async () => {
    mockFetch([{ status: 404, body: { code: 'NOT_FOUND', message: 'Participant not found' } }]);
    const result = await service.post('/epochs/epoch-1/ready', {
      simulation_id: 'sim-999',
      ready: true,
    });
    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NOT_FOUND');
  });
});
