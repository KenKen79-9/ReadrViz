import { test, expect } from "@playwright/test";

const DEMO_EMAIL = "demo@readrviz.dev";
const DEMO_PASSWORD = "password123";

test.describe("Authentication", () => {
  test("home page loads and shows CTA for unauthenticated users", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/ReadrViz/);
    await expect(page.getByText("Read more.")).toBeVisible();
    await expect(page.getByRole("link", { name: /Start tracking free/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Browse books/i })).toBeVisible();
  });

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign in/i })).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("wrong@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page.getByText(/Invalid credentials/i)).toBeVisible({ timeout: 5000 });
  });

  test("successful login redirects to dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(DEMO_EMAIL);
    await page.getByLabel("Password").fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByText(/Reading Analytics/i)).toBeVisible();
  });

  test("register page renders correctly", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /Create your account/i })).toBeVisible();
    await expect(page.getByLabel("Display name")).toBeVisible();
    await expect(page.getByLabel("Username")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("demo shortcut fills credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Use demo account/i }).click();
    await expect(page.getByLabel("Email")).toHaveValue(DEMO_EMAIL);
    await expect(page.getByLabel("Password")).toHaveValue(DEMO_PASSWORD);
  });

  test("navbar shows sign in link when not authenticated", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Sign in/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Get started/i })).toBeVisible();
  });
});
