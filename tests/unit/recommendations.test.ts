import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
vi.mock("@/lib/db", () => ({
  db: {
    shelfBook: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    book: {
      findMany: vi.fn(),
    },
    userMetrics: {
      findUnique: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import { predictFinishProbability } from "@/lib/recommendations";

const mockUserMetrics = {
  id: "metrics-1",
  userId: "user-1",
  totalBooksRead: 25,
  totalPagesRead: 8000,
  totalDnf: 3,
  avgDaysToFinish: 12,
  currentStreak: 5,
  longestStreak: 30,
  dnfRate: 0.12,
  booksThisYear: 10,
  pagesThisMonth: 800,
  pagesThisYear: 3200,
  genreDistribution: { Fantasy: 10, "Literary Fiction": 8, Nonfiction: 5 },
  completionByGenre: { Fantasy: 0.88, "Literary Fiction": 0.75, Nonfiction: 0.92 },
  dnfByGenre: { Fantasy: 0.05, "Literary Fiction": 0.15, Nonfiction: 0.03 },
  totalSpent: 120,
  costPerBook: 14,
  libraryRatio: 0.3,
  avgPagesPerDay: 35,
  updatedAt: new Date(),
};

describe("predictFinishProbability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns baseline when no data", async () => {
    vi.mocked(db.book.findMany).mockResolvedValue([]);
    vi.mocked(db.userMetrics.findUnique).mockResolvedValue(null);

    // Mock findUnique for book
    const { db: mockDb } = await import("@/lib/db");
    (mockDb as { book: { findUnique: ReturnType<typeof vi.fn> } }).book = {
      findUnique: vi.fn().mockResolvedValue(null),
    };

    const result = await predictFinishProbability("user-1", "book-1");
    expect(result.probability).toBe(0.75);
    expect(result.factors).toHaveLength(1);
  });

  it("boosts probability for high-completion books in matching genre", async () => {
    const { db: mockDb } = await import("@/lib/db");
    (mockDb as { book: { findUnique: ReturnType<typeof vi.fn> } }).book = {
      findUnique: vi.fn().mockResolvedValue({
        id: "book-1",
        genre: ["Fantasy"],
        pace: "FAST",
        pageCount: 300,
        completionRate: 0.9,
        dnfRate: 0.05,
      }),
    };
    (mockDb as { userMetrics: { findUnique: ReturnType<typeof vi.fn> } }).userMetrics = {
      findUnique: vi.fn().mockResolvedValue(mockUserMetrics),
    };

    const result = await predictFinishProbability("user-1", "book-1");
    expect(result.probability).toBeGreaterThan(0.85);
    expect(result.factors.length).toBeGreaterThan(0);
  });

  it("returns a clamped probability between 0.1 and 0.97", async () => {
    const { db: mockDb } = await import("@/lib/db");
    (mockDb as { book: { findUnique: ReturnType<typeof vi.fn> } }).book = {
      findUnique: vi.fn().mockResolvedValue({
        id: "book-1",
        genre: ["Literary Fiction"],
        pace: "SLOW",
        pageCount: 900,
        completionRate: 0.3,
        dnfRate: 0.5,
      }),
    };
    (mockDb as { userMetrics: { findUnique: ReturnType<typeof vi.fn> } }).userMetrics = {
      findUnique: vi.fn().mockResolvedValue({ ...mockUserMetrics, dnfRate: 0.4 }),
    };

    const result = await predictFinishProbability("user-1", "book-1");
    expect(result.probability).toBeGreaterThanOrEqual(0.1);
    expect(result.probability).toBeLessThanOrEqual(0.97);
  });

  it("includes a factors array", async () => {
    const { db: mockDb } = await import("@/lib/db");
    (mockDb as { book: { findUnique: ReturnType<typeof vi.fn> } }).book = {
      findUnique: vi.fn().mockResolvedValue({
        id: "book-1",
        genre: ["Fantasy"],
        pace: "MEDIUM",
        pageCount: 400,
        completionRate: 0.8,
        dnfRate: 0.1,
      }),
    };
    (mockDb as { userMetrics: { findUnique: ReturnType<typeof vi.fn> } }).userMetrics = {
      findUnique: vi.fn().mockResolvedValue(mockUserMetrics),
    };

    const result = await predictFinishProbability("user-1", "book-1");
    expect(Array.isArray(result.factors)).toBe(true);
    expect(result.factors.length).toBeLessThanOrEqual(3);
  });
});
