import { type Page, expect } from '@playwright/test';

/**
 * Test user credentials.
 * These users must exist in the Supabase Auth database (created via seed data).
 */
export const TEST_USER = {
  email: 'test@velgarien.dev',
  password: 'TestPassword123!',
};

export const TEST_USER_B = {
  email: 'test-b@velgarien.dev',
  password: 'TestPassword123!',
};

/**
 * Log in via the /login page using email and password.
 * Waits for the redirect to /dashboard before returning.
 */
export async function login(
  page: Page,
  email?: string,
  password?: string,
): Promise<void> {
  await page.goto('/login');
  await page.locator('[data-testid="email-input"]').fill(email ?? TEST_USER.email);
  await page.locator('[data-testid="password-input"]').fill(password ?? TEST_USER.password);
  await page.locator('[data-testid="login-button"]').click();
  await page.waitForURL('/dashboard', { timeout: 15_000 });
}

/**
 * Log out via the user menu dropdown.
 * Waits for the redirect to /login before returning.
 */
export async function logout(page: Page): Promise<void> {
  await page.locator('[data-testid="user-menu-button"]').click();
  await page.locator('[data-testid="logout-button"]').click();
  await page.waitForURL('/login', { timeout: 10_000 });
}

/**
 * Register a new user via the /register page.
 * Returns the email used for registration.
 */
export async function register(
  page: Page,
  email: string,
  password: string,
  displayName?: string,
): Promise<string> {
  await page.goto('/register');
  if (displayName) {
    await page.locator('[data-testid="display-name-input"]').fill(displayName);
  }
  await page.locator('[data-testid="email-input"]').fill(email);
  await page.locator('[data-testid="password-input"]').fill(password);
  await page.locator('[data-testid="register-button"]').click();
  await page.waitForURL('/dashboard', { timeout: 15_000 });
  return email;
}

/**
 * Assert that the user is currently on the login page (not authenticated).
 */
export async function expectOnLoginPage(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
}

/**
 * Assert that the user is on the dashboard (authenticated).
 */
export async function expectOnDashboard(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/dashboard/);
}
