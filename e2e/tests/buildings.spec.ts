import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
import { navigateToSimulation, createBuilding, uniqueName, confirmDelete } from '../helpers/fixtures';

test.describe('Building CRUD operations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToSimulation(page, 'buildings');
  });

  test('displays building list', async ({ page }) => {
    // The buildings view component should be rendered
    await expect(page.locator('velg-buildings-view')).toBeVisible();

    // There should be at least one building from seed data
    const buildingCards = page.locator('[data-testid="building-card"]');
    await expect(buildingCards.first()).toBeVisible({ timeout: 10_000 });

    const count = await buildingCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('creates a new building', async ({ page }) => {
    const buildingName = uniqueName('TestBuilding');

    await createBuilding(page, buildingName);

    // The newly created building should appear in the list
    await expect(page.locator(`text="${buildingName}"`)).toBeVisible({ timeout: 10_000 });
  });

  test('edits an existing building', async ({ page }) => {
    // First create a building to edit
    const originalName = uniqueName('EditBuilding');
    await createBuilding(page, originalName);
    await expect(page.locator(`text="${originalName}"`)).toBeVisible({ timeout: 10_000 });

    // Open edit modal for the created building
    const buildingRow = page.locator('[data-testid="entity-row"]', {
      has: page.locator(`text="${originalName}"`),
    });
    await buildingRow.locator('[data-testid="edit-button"]').click();

    // Wait for the edit modal to open
    await expect(page.locator('[data-testid="building-name-input"]')).toBeVisible();

    // Change the name
    const updatedName = uniqueName('UpdatedBuilding');
    await page.locator('[data-testid="building-name-input"]').clear();
    await page.locator('[data-testid="building-name-input"]').fill(updatedName);
    await page.locator('[data-testid="save-button"]').click();

    // Wait for success feedback
    await expect(page.locator('velg-toast')).toBeVisible({ timeout: 10_000 });

    // The updated name should be visible
    await expect(page.locator(`text="${updatedName}"`)).toBeVisible({ timeout: 10_000 });
  });

  test('deletes a building with confirmation', async ({ page }) => {
    // First create a building to delete
    const buildingName = uniqueName('DeleteBuilding');
    await createBuilding(page, buildingName);
    await expect(page.locator(`text="${buildingName}"`)).toBeVisible({ timeout: 10_000 });

    // Click the delete button on the building
    const buildingRow = page.locator('[data-testid="entity-row"]', {
      has: page.locator(`text="${buildingName}"`),
    });
    await buildingRow.locator('[data-testid="delete-button"]').click();

    // Confirm the deletion in the dialog
    await confirmDelete(page);

    // The building should no longer appear in the list
    await expect(page.locator(`text="${buildingName}"`)).toBeHidden({ timeout: 10_000 });
  });
});
