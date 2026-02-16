import { type Page, expect } from '@playwright/test';

/**
 * Well-known test simulation (created via seed data).
 * Must match the UUID from supabase/seed/001_simulation.sql.
 */
export const TEST_SIMULATION_ID = '00000000-0000-0000-0000-000000000001';
export const TEST_SIMULATION_SLUG = 'velgarien';

/**
 * Generate a unique name with a timestamp suffix to avoid collisions
 * between parallel or re-run tests.
 */
export function uniqueName(prefix: string): string {
  const stamp = Date.now().toString(36);
  return `${prefix}-${stamp}`;
}

// ---------------------------------------------------------------------------
// Navigation helpers
// ---------------------------------------------------------------------------

/**
 * Navigate to a section within the test simulation.
 * Waits for the simulation shell component to render.
 */
export async function navigateToSimulation(
  page: Page,
  section: 'agents' | 'buildings' | 'events' | 'chat' | 'settings' | 'social' | 'locations',
): Promise<void> {
  await page.goto(`/simulations/${TEST_SIMULATION_ID}/${section}`);
  await expect(page.locator('velg-simulation-shell')).toBeVisible({ timeout: 15_000 });
}

// ---------------------------------------------------------------------------
// Entity creation helpers (via UI)
// ---------------------------------------------------------------------------

/**
 * Create a new agent through the agents view UI.
 */
export async function createAgent(page: Page, name: string): Promise<void> {
  await page.locator('[data-testid="create-button"]').click();
  await expect(page.locator('[data-testid="agent-name-input"]')).toBeVisible();
  await page.locator('[data-testid="agent-name-input"]').fill(name);
  await page.locator('[data-testid="save-button"]').click();
  await expect(page.locator('velg-toast')).toBeVisible({ timeout: 10_000 });
}

/**
 * Create a new building through the buildings view UI.
 */
export async function createBuilding(page: Page, name: string): Promise<void> {
  await page.locator('[data-testid="create-button"]').click();
  await expect(page.locator('[data-testid="building-name-input"]')).toBeVisible();
  await page.locator('[data-testid="building-name-input"]').fill(name);
  await page.locator('[data-testid="save-button"]').click();
  await expect(page.locator('velg-toast')).toBeVisible({ timeout: 10_000 });
}

/**
 * Create a new event through the events view UI.
 */
export async function createEvent(page: Page, title: string): Promise<void> {
  await page.locator('[data-testid="create-button"]').click();
  await expect(page.locator('[data-testid="event-title-input"]')).toBeVisible();
  await page.locator('[data-testid="event-title-input"]').fill(title);
  await page.locator('[data-testid="save-button"]').click();
  await expect(page.locator('velg-toast')).toBeVisible({ timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// Entity interaction helpers
// ---------------------------------------------------------------------------

/**
 * Click the edit button on the first matching row/card for the given entity name.
 */
export async function openEditFor(page: Page, entityName: string): Promise<void> {
  const row = page.locator(`[data-testid="entity-row"]`, {
    has: page.locator(`text="${entityName}"`),
  });
  await row.locator('[data-testid="edit-button"]').click();
}

/**
 * Confirm a delete dialog.
 */
export async function confirmDelete(page: Page): Promise<void> {
  await expect(page.locator('velg-confirm-dialog')).toBeVisible();
  await page.locator('[data-testid="confirm-button"]').click();
  await expect(page.locator('velg-toast')).toBeVisible({ timeout: 10_000 });
}

/**
 * Dismiss a toast notification by waiting for it to auto-close.
 */
export async function waitForToastDismiss(page: Page): Promise<void> {
  await expect(page.locator('velg-toast')).toBeHidden({ timeout: 10_000 });
}
