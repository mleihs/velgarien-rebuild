import { expect, test } from '@playwright/test';
import { login, TEST_USER_B } from '../helpers/auth';
import { navigateToSimulation } from '../helpers/fixtures';

test.describe('Multi-User Access Control', () => {
  test('owner can create an invitation', async ({ page }) => {
    // Login as the primary test user (owner) using default credentials
    await login(page);
    await navigateToSimulation(page, 'settings');

    const settingsView = page.locator('velg-settings-view');
    await expect(settingsView).toBeVisible();

    // Click on the Access tab
    const accessTab = settingsView.locator('.settings__tab', { hasText: 'Access' });
    await expect(accessTab).toBeVisible();
    await accessTab.click();

    // Verify the Access settings panel loads
    const accessPanel = settingsView.locator('velg-access-settings-panel');
    await expect(accessPanel).toBeVisible({ timeout: 10_000 });

    // Wait for the panel to fully load (look for the Access Control title)
    const sectionTitle = accessPanel.locator('.panel__section-title', {
      hasText: 'Access Control',
    });
    await expect(sectionTitle).toBeVisible({ timeout: 10_000 });

    // Find and click the "Create Invitation" button
    const createInviteButton = accessPanel.locator('.btn--primary', {
      hasText: 'Create Invitation',
    });
    await expect(createInviteButton).toBeVisible();
    await createInviteButton.click();

    // The invite form should appear
    const inviteForm = accessPanel.locator('.invite-form');
    await expect(inviteForm).toBeVisible();

    // Fill in the invitation email (optional)
    const emailInput = inviteForm.locator('.invite-form__input[type="email"]');
    await expect(emailInput).toBeVisible();
    await emailInput.fill('e2e-test@example.com');

    // Select a role for the invitation
    const roleSelect = inviteForm.locator('.invite-form__select');
    await expect(roleSelect).toBeVisible();
    await roleSelect.selectOption('viewer');

    // Click the "Create" button within the invite form
    const createButton = inviteForm.locator('.btn--primary', { hasText: 'Create' });
    await expect(createButton).toBeVisible();
    await createButton.click();

    // A toast notification should confirm the invitation was created
    const toast = page.locator('velg-toast');
    await expect(toast).toContainText(/invitation created/i, { timeout: 5_000 });

    // The invite link should be displayed
    const inviteLink = inviteForm.locator('.invite-link');
    await expect(inviteLink).toBeVisible({ timeout: 5_000 });

    // The invite link URL should contain the expected path
    const inviteLinkUrl = inviteLink.locator('.invite-link__url');
    await expect(inviteLinkUrl).toBeVisible();
    const linkText = await inviteLinkUrl.textContent();
    expect(linkText).toContain('/invitations/');

    // A "Copy" button should be present
    const copyButton = inviteLink.locator('.invite-link__copy-btn');
    await expect(copyButton).toBeVisible();
  });

  test('viewer cannot see edit/delete buttons', async ({ page }) => {
    // Login as the secondary test user (assumed to be a viewer)
    await login(page, TEST_USER_B.email, TEST_USER_B.password);
    await navigateToSimulation(page, 'agents');

    // Wait for the agents view to load
    const agentsView = page.locator('velg-agents-view');
    await expect(agentsView).toBeVisible();

    // Wait for the loading state to complete
    const loadingState = agentsView.locator('velg-loading-state');
    await expect(loadingState).not.toBeVisible({ timeout: 10_000 });

    // The "Create Agent" button should NOT be visible for a viewer
    const createButton = agentsView.locator('.view__create-btn');
    await expect(createButton).not.toBeVisible();

    // Check agent cards for absence of edit/delete actions
    const agentCards = agentsView.locator('velg-agent-card');
    const cardCount = await agentCards.count();

    if (cardCount > 0) {
      const firstCard = agentCards.first();
      await expect(firstCard).toBeVisible();

      // Edit and delete buttons should not be present on agent cards for viewers
      const editButton = firstCard.locator('[data-testid="agent-edit-btn"]');
      const deleteButton = firstCard.locator('[data-testid="agent-delete-btn"]');
      await expect(editButton).not.toBeVisible();
      await expect(deleteButton).not.toBeVisible();
    }
  });

  test('viewer cannot access settings', async ({ page }) => {
    // Login as the secondary test user (viewer)
    await login(page, TEST_USER_B.email, TEST_USER_B.password);
    await navigateToSimulation(page, 'agents');

    // Wait for the simulation nav to be visible
    const nav = page.locator('velg-simulation-nav');
    await expect(nav).toBeVisible();

    // Get all visible navigation tabs
    const navTabs = nav.locator('.nav__tab');
    const tabCount = await navTabs.count();
    const tabTexts: string[] = [];

    for (let i = 0; i < tabCount; i++) {
      const text = await navTabs.nth(i).textContent();
      if (text) {
        tabTexts.push(text.trim().toLowerCase());
      }
    }

    // The "Settings" tab should NOT be visible for a viewer
    // (SimulationNav filters tabs with requireAdmin: true when canAdmin is false)
    expect(tabTexts).not.toContain('settings');

    // Verify the expected non-admin tabs are present
    expect(tabTexts).toContain('agents');
    expect(tabTexts).toContain('buildings');
    expect(tabTexts).toContain('events');
    expect(tabTexts).toContain('chat');
    expect(tabTexts).toContain('social');
    expect(tabTexts).toContain('locations');
  });
});
