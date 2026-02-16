import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
import { navigateToSimulation, createEvent, uniqueName, confirmDelete } from '../helpers/fixtures';

test.describe('Event CRUD operations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToSimulation(page, 'events');
  });

  test('displays event list', async ({ page }) => {
    // The events view component should be rendered
    await expect(page.locator('velg-events-view')).toBeVisible();

    // There should be at least one event from seed data
    const eventCards = page.locator('[data-testid="event-card"]');
    await expect(eventCards.first()).toBeVisible({ timeout: 10_000 });

    const count = await eventCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('creates a new event', async ({ page }) => {
    const eventTitle = uniqueName('TestEvent');

    await createEvent(page, eventTitle);

    // The newly created event should appear in the list
    await expect(page.locator(`text="${eventTitle}"`)).toBeVisible({ timeout: 10_000 });
  });

  test('edits an existing event', async ({ page }) => {
    // First create an event to edit
    const originalTitle = uniqueName('EditEvent');
    await createEvent(page, originalTitle);
    await expect(page.locator(`text="${originalTitle}"`)).toBeVisible({ timeout: 10_000 });

    // Open edit modal for the created event
    const eventRow = page.locator('[data-testid="entity-row"]', {
      has: page.locator(`text="${originalTitle}"`),
    });
    await eventRow.locator('[data-testid="edit-button"]').click();

    // Wait for the edit modal to open
    await expect(page.locator('[data-testid="event-title-input"]')).toBeVisible();

    // Change the title
    const updatedTitle = uniqueName('UpdatedEvent');
    await page.locator('[data-testid="event-title-input"]').clear();
    await page.locator('[data-testid="event-title-input"]').fill(updatedTitle);
    await page.locator('[data-testid="save-button"]').click();

    // Wait for success feedback
    await expect(page.locator('velg-toast')).toBeVisible({ timeout: 10_000 });

    // The updated title should be visible
    await expect(page.locator(`text="${updatedTitle}"`)).toBeVisible({ timeout: 10_000 });
  });

  test('deletes an event with confirmation', async ({ page }) => {
    // First create an event to delete
    const eventTitle = uniqueName('DeleteEvent');
    await createEvent(page, eventTitle);
    await expect(page.locator(`text="${eventTitle}"`)).toBeVisible({ timeout: 10_000 });

    // Click the delete button on the event
    const eventRow = page.locator('[data-testid="entity-row"]', {
      has: page.locator(`text="${eventTitle}"`),
    });
    await eventRow.locator('[data-testid="delete-button"]').click();

    // Confirm the deletion in the dialog
    await confirmDelete(page);

    // The event should no longer appear in the list
    await expect(page.locator(`text="${eventTitle}"`)).toBeHidden({ timeout: 10_000 });
  });
});
