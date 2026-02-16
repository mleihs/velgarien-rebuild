import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';
import { navigateToSimulation, createAgent, uniqueName, confirmDelete } from '../helpers/fixtures';

test.describe('Agent CRUD operations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateToSimulation(page, 'agents');
  });

  test('displays agent list', async ({ page }) => {
    // The agents view component should be rendered
    await expect(page.locator('velg-agents-view')).toBeVisible();

    // There should be at least one agent from seed data
    const agentCards = page.locator('[data-testid="agent-card"]');
    await expect(agentCards.first()).toBeVisible({ timeout: 10_000 });

    const count = await agentCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('creates a new agent', async ({ page }) => {
    const agentName = uniqueName('TestAgent');

    await createAgent(page, agentName);

    // The newly created agent should appear in the list
    await expect(page.locator(`text="${agentName}"`)).toBeVisible({ timeout: 10_000 });
  });

  test('edits an existing agent', async ({ page }) => {
    // First create an agent to edit
    const originalName = uniqueName('EditAgent');
    await createAgent(page, originalName);
    await expect(page.locator(`text="${originalName}"`)).toBeVisible({ timeout: 10_000 });

    // Open edit modal for the created agent
    const agentRow = page.locator('[data-testid="entity-row"]', {
      has: page.locator(`text="${originalName}"`),
    });
    await agentRow.locator('[data-testid="edit-button"]').click();

    // Wait for the edit modal to open
    await expect(page.locator('[data-testid="agent-name-input"]')).toBeVisible();

    // Change the name
    const updatedName = uniqueName('UpdatedAgent');
    await page.locator('[data-testid="agent-name-input"]').clear();
    await page.locator('[data-testid="agent-name-input"]').fill(updatedName);
    await page.locator('[data-testid="save-button"]').click();

    // Wait for success feedback
    await expect(page.locator('velg-toast')).toBeVisible({ timeout: 10_000 });

    // The updated name should be visible
    await expect(page.locator(`text="${updatedName}"`)).toBeVisible({ timeout: 10_000 });
  });

  test('deletes an agent with confirmation', async ({ page }) => {
    // First create an agent to delete
    const agentName = uniqueName('DeleteAgent');
    await createAgent(page, agentName);
    await expect(page.locator(`text="${agentName}"`)).toBeVisible({ timeout: 10_000 });

    // Click the delete button on the agent
    const agentRow = page.locator('[data-testid="entity-row"]', {
      has: page.locator(`text="${agentName}"`),
    });
    await agentRow.locator('[data-testid="delete-button"]').click();

    // Confirm the deletion in the dialog
    await confirmDelete(page);

    // The agent should no longer appear in the list
    await expect(page.locator(`text="${agentName}"`)).toBeHidden({ timeout: 10_000 });
  });

  test('filters agents by system', async ({ page }) => {
    // Wait for the filter bar to be available
    await expect(page.locator('[data-testid="filter-bar"]')).toBeVisible({ timeout: 10_000 });

    // Open the system filter dropdown
    await page.locator('[data-testid="filter-system"]').click();

    // Select a filter option (first non-empty option)
    const filterOptions = page.locator('[data-testid="filter-option"]');
    await expect(filterOptions.first()).toBeVisible();
    const optionText = await filterOptions.first().textContent();
    await filterOptions.first().click();

    // The agent list should update (may have fewer items)
    // Verify that the filter is applied by checking the active filter indicator
    await expect(page.locator('[data-testid="active-filter"]')).toBeVisible({ timeout: 5_000 });
  });

  test('searches agents by name', async ({ page }) => {
    // First create an agent with a unique searchable name
    const searchableName = uniqueName('Searchable');
    await createAgent(page, searchableName);
    await expect(page.locator(`text="${searchableName}"`)).toBeVisible({ timeout: 10_000 });

    // Use the search input
    await page.locator('[data-testid="search-input"]').fill(searchableName);

    // Wait for search results to update
    await page.waitForTimeout(500); // Debounce delay

    // The searchable agent should be visible
    await expect(page.locator(`text="${searchableName}"`)).toBeVisible();

    // Search for something that should not match
    await page.locator('[data-testid="search-input"]').clear();
    await page.locator('[data-testid="search-input"]').fill('zzznonexistent999');

    // Wait for search results to update
    await page.waitForTimeout(500);

    // Should show empty state or no matching agents
    const agentCards = page.locator('[data-testid="agent-card"]');
    const visibleCount = await agentCards.count();
    // Either no cards, or an empty state is shown
    if (visibleCount === 0) {
      await expect(page.locator('velg-empty-state')).toBeVisible();
    }
  });
});
