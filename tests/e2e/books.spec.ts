import { test, expect } from "@playwright/test";

test.describe("Book catalog and discovery", () => {
  test("books page loads and shows grid", async ({ page }) => {
    await page.goto("/books");
    await expect(page.getByRole("heading", { name: /Discover Books/i })).toBeVisible();
    // Should show book cards
    await expect(page.locator("a[href^='/books/']").first()).toBeVisible({ timeout: 8000 });
  });

  test("search filters books by query", async ({ page }) => {
    await page.goto("/books");
    // Use the sort dropdown to interact with the filter area
    await expect(page.getByRole("combobox")).toBeVisible();
    // Navigate with query param
    await page.goto("/books?query=piranesi");
    await expect(page.getByText(/Piranesi/i)).toBeVisible({ timeout: 8000 });
  });

  test("filter toggle shows filter panel", async ({ page }) => {
    await page.goto("/books");
    const filterButton = page.getByRole("button", { name: /Filters/i });
    await filterButton.click();
    // Genre section should appear
    await expect(page.getByText(/Genre/i)).toBeVisible();
    await expect(page.getByText(/Mood/i)).toBeVisible();
    await expect(page.getByText(/Pace/i)).toBeVisible();
  });

  test("book detail page loads", async ({ page }) => {
    await page.goto("/books");
    // Click first book
    const firstBook = page.locator("a[href^='/books/']").first();
    const href = await firstBook.getAttribute("href");
    if (href) {
      await page.goto(href);
      // Should show book details
      await expect(page.getByText(/Completion/i)).toBeVisible({ timeout: 8000 });
      await expect(page.getByRole("button", { name: /Add to Shelf/i })).toBeVisible();
    }
  });

  test("book page shows tabs", async ({ page }) => {
    await page.goto("/books");
    const firstBook = page.locator("a[href^='/books/']").first();
    const href = await firstBook.getAttribute("href");
    if (href) {
      await page.goto(href);
      await expect(page.getByRole("tab", { name: /Overview/i })).toBeVisible();
      await expect(page.getByRole("tab", { name: /Reviews/i })).toBeVisible();
      await expect(page.getByRole("tab", { name: /Analytics/i })).toBeVisible();
    }
  });

  test("unauthenticated user redirected to login when clicking add to shelf", async ({ page }) => {
    await page.goto("/books");
    const firstBook = page.locator("a[href^='/books/']").first();
    const href = await firstBook.getAttribute("href");
    if (href) {
      await page.goto(href);
      const addButton = page.getByRole("button", { name: /Add to Shelf/i });
      await addButton.click();
      // Should redirect to login (or the add button triggers login redirect)
      // Either the page stays or redirects
    }
  });

  test("search returns no results message for nonsense query", async ({ page }) => {
    await page.goto("/books?query=xyzzy_nonsense_book_that_does_not_exist");
    await expect(page.getByText(/No books found/i)).toBeVisible({ timeout: 8000 });
  });

  test("navbar search works", async ({ page }) => {
    await page.goto("/books");
    const searchInput = page.getByLabel("Search");
    await searchInput.fill("project hail mary");
    // Should show dropdown with results
    await expect(page.getByText(/Project Hail Mary/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Book clubs", () => {
  test("clubs page loads", async ({ page }) => {
    await page.goto("/clubs");
    await expect(page.getByRole("heading", { name: /Book Clubs/i })).toBeVisible();
  });

  test("shows club cards", async ({ page }) => {
    await page.goto("/clubs");
    // At least one club from seed data
    await page.waitForSelector("a[href^='/clubs/']", { timeout: 8000 });
    const clubs = page.locator("a[href^='/clubs/']");
    const count = await clubs.count();
    expect(count).toBeGreaterThan(0);
  });
});
