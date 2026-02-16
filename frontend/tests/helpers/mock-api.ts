import { vi } from 'vitest';
import type { ApiResponse } from '../../src/types/index.js';

/**
 * Create a successful ApiResponse wrapper.
 */
export function mockSuccess<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

/**
 * Create a failed ApiResponse wrapper.
 */
export function mockError(message: string, code = 'ERROR'): ApiResponse<never> {
  return { success: false, error: { code, message } };
}

/**
 * Mock globalThis.fetch with a sequence of pre-configured responses.
 * Each call to fetch will return the next response in the array.
 * If more calls are made than responses provided, the last response is reused.
 */
export function mockFetch(
  responses: Array<{ status?: number; body: unknown }>,
): ReturnType<typeof vi.spyOn> {
  let callIndex = 0;
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
    const response = responses[callIndex] ?? responses[responses.length - 1];
    callIndex++;
    return new Response(JSON.stringify(response.body), {
      status: response.status ?? 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

/**
 * Mock globalThis.fetch to reject with a network error.
 */
export function mockFetchNetworkError(
  message = 'Network request failed',
): ReturnType<typeof vi.spyOn> {
  return vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError(message));
}

/**
 * Restore all vi mocks (including fetch).
 */
export function resetFetchMock(): void {
  vi.restoreAllMocks();
}
