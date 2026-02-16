import { test, expect } from '@playwright/test';
import { login, logout, register, expectOnLoginPage, expectOnDashboard, TEST_USER } from '../helpers/auth';
import { uniqueName } from '../helpers/fixtures';

test.describe('Authentication flows', () => {
  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await login(page);
    await expectOnDashboard(page);

    // The user menu should be visible, indicating an authenticated session
    await expect(page.locator('[data-testid="user-menu-button"]')).toBeVisible();
  });

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    await page.locator('[data-testid="email-input"]').fill('nonexistent@velgarien.dev');
    await page.locator('[data-testid="password-input"]').fill('WrongPassword999!');
    await page.locator('[data-testid="login-button"]').click();

    // Should stay on the login page
    await expect(page).toHaveURL(/\/login/);

    // An error message should be displayed
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="auth-error"]')).toContainText(/invalid|incorrect|wrong|credentials/i);
  });

  test('register new user redirects to dashboard', async ({ page }) => {
    const stamp = uniqueName('e2e');
    const email = `${stamp}@velgarien.dev`;
    const password = 'SecureE2EPass456!';

    await register(page, email, password, `E2E User ${stamp}`);
    await expectOnDashboard(page);

    // The user menu should be visible after registration
    await expect(page.locator('[data-testid="user-menu-button"]')).toBeVisible();
  });

  test('logout redirects to login', async ({ page }) => {
    // First log in
    await login(page);
    await expectOnDashboard(page);

    // Then log out
    await logout(page);
    await expectOnLoginPage(page);
  });

  test('unauthenticated user is redirected to login on protected routes', async ({ page }) => {
    // Try to access dashboard without logging in
    await page.goto('/dashboard');
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expectOnLoginPage(page);

    // Try to access a simulation page without logging in
    await page.goto('/simulations/00000000-0000-0000-0000-000000000001/agents');
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expectOnLoginPage(page);

    // Try to access profile without logging in
    await page.goto('/profile');
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    await expectOnLoginPage(page);
  });

  test('authenticated user visiting /login is redirected to dashboard', async ({ page }) => {
    // Log in first
    await login(page);
    await expectOnDashboard(page);

    // Navigate to /login while authenticated
    await page.goto('/login');
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
    await expectOnDashboard(page);
  });
});
