import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
import { navigateToSimulation, TEST_SIMULATION_ID } from '../helpers/fixtures';

const SIM_VELGARIEN = '10000000-0000-0000-0000-000000000001';

/**
 * Click on a building card's body area (shadow DOM piercing).
 * Finds a card containing the given building name and clicks the body.
 */
async function clickBuildingCardByName(
  page: import('@playwright/test').Page,
  name: string,
) {
  const card = page.locator('velg-building-card', {
    has: page.locator(`.card__name`, { hasText: name }),
  });
  await card.locator('.card__body').click();
}

test.describe('Embassy System (anonymous)', () => {
  test('embassy badge visible on building cards', async ({ page }) => {
    await page.goto(`/simulations/${SIM_VELGARIEN}/buildings`);
    await expect(page.locator('velg-buildings-view')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('velg-building-card').first()).toBeVisible({ timeout: 10_000 });

    // Embassy buildings from demo data: Room 441, The Static Room, Archive Sub-Level C
    // At least one should have the Embassy badge
    const embassyBadges = page.locator('velg-building-card velg-badge', { hasText: 'Embassy' });
    await expect(embassyBadges.first()).toBeVisible({ timeout: 10_000 });

    const count = await embassyBadges.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('embassies API returns data for simulation', async ({ page }) => {
    const response = await page.request.get(
      `/api/v1/public/simulations/${SIM_VELGARIEN}/embassies`,
    );

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBeTruthy();
    // Velgarien has 3 embassy connections in demo data
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('embassy for building returns data', async ({ page }) => {
    // First get embassy buildings list to find a building ID
    const listResponse = await page.request.get(
      `/api/v1/public/simulations/${SIM_VELGARIEN}/embassies`,
    );
    const listBody = await listResponse.json();
    expect(listBody.success).toBe(true);
    expect(listBody.data.length).toBeGreaterThan(0);

    // Use the first embassy's building_a_id or building_b_id that belongs to Velgarien
    const embassy = listBody.data[0];
    const buildingId =
      embassy.simulation_a_id === SIM_VELGARIEN
        ? embassy.building_a_id
        : embassy.building_b_id;

    const response = await page.request.get(
      `/api/v1/public/simulations/${SIM_VELGARIEN}/buildings/${buildingId}/embassy`,
    );

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).not.toBeNull();
    expect(body.data).toHaveProperty('status');
    expect(body.data).toHaveProperty('bleed_vector');
  });

  test('all active embassies API returns data', async ({ page }) => {
    const response = await page.request.get('/api/v1/public/embassies');

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBeTruthy();
    // 6 embassies across all 4 simulations in demo data
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });

  test('multiverse map shows embassy edges', async ({ page }) => {
    await page.goto('/multiverse');
    await expect(page.locator('velg-map-graph')).toBeVisible({ timeout: 15_000 });

    // Embassy edges are rendered as SVG paths with class embassy-edge-line
    const embassyEdges = page.locator('velg-map-graph .embassy-edge-line');
    await expect(embassyEdges.first()).toBeVisible({ timeout: 10_000 });

    const count = await embassyEdges.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('map-data API includes embassy data', async ({ page }) => {
    const response = await page.request.get('/api/v1/public/map-data');

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('embassies');
    expect(Array.isArray(body.data.embassies)).toBeTruthy();
    expect(body.data.embassies.length).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Embassy System (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToSimulation(page, 'buildings');
  });

  test('building details panel shows embassy section', async ({ page }) => {
    await expect(page.locator('velg-building-card').first()).toBeVisible({ timeout: 10_000 });

    // Click on an embassy building (Room 441 is a known embassy building in Velgarien)
    await clickBuildingCardByName(page, 'Room 441');

    // Side panel should open
    await expect(page.locator('velg-building-details-panel')).toBeVisible({ timeout: 10_000 });

    // Embassy Link section should be visible (rendered by velg-embassy-link)
    const embassyLink = page.locator('velg-embassy-link');
    await expect(embassyLink).toBeVisible({ timeout: 10_000 });
  });

  test('embassy link shows partner info and status', async ({ page }) => {
    await expect(page.locator('velg-building-card').first()).toBeVisible({ timeout: 10_000 });

    // Open details for Room 441 (paired with The Threshold in Capybara Kingdom)
    await clickBuildingCardByName(page, 'Room 441');
    await expect(page.locator('velg-building-details-panel')).toBeVisible({ timeout: 10_000 });

    const embassyLink = page.locator('velg-embassy-link');
    await expect(embassyLink).toBeVisible({ timeout: 10_000 });

    // Partner simulation name should be visible
    const simName = embassyLink.locator('.embassy__sim-name');
    await expect(simName).toBeVisible();

    // Partner building name should be visible
    const partnerName = embassyLink.locator('.embassy__name');
    await expect(partnerName).toBeVisible();

    // Status badge should be visible (active, suspended, etc.)
    const statusBadge = embassyLink.locator('velg-badge');
    await expect(statusBadge).toBeVisible();
  });
});
