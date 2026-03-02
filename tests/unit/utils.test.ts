import { describe, it, expect } from "vitest";
import {
  formatNumber,
  formatPercent,
  formatRating,
  analyzeSentiment,
  extractThemes,
  paceLabel,
  polarizationLabel,
  completionLabel,
  forecastBooks,
  readingTime,
} from "@/lib/utils";

describe("formatNumber", () => {
  it("formats numbers under 1000 as-is", () => {
    expect(formatNumber(42)).toBe("42");
    expect(formatNumber(999)).toBe("999");
  });

  it("formats thousands with k suffix", () => {
    expect(formatNumber(1000)).toBe("1.0k");
    expect(formatNumber(4200)).toBe("4.2k");
  });

  it("formats millions with M suffix", () => {
    expect(formatNumber(1_200_000)).toBe("1.2M");
  });
});

describe("formatPercent", () => {
  it("converts rate to percentage string", () => {
    expect(formatPercent(0.75)).toBe("75%");
    expect(formatPercent(1)).toBe("100%");
    expect(formatPercent(0)).toBe("0%");
  });
});

describe("formatRating", () => {
  it("formats to 1 decimal", () => {
    expect(formatRating(4.5)).toBe("4.5");
    expect(formatRating(3)).toBe("3.0");
  });
});

describe("analyzeSentiment", () => {
  it("returns positive score for positive review", () => {
    const score = analyzeSentiment("This book was absolutely amazing and brilliant. Loved it!");
    expect(score).toBeGreaterThan(0);
  });

  it("returns negative score for negative review", () => {
    const score = analyzeSentiment("Terrible and boring. Complete waste of time. Awful.");
    expect(score).toBeLessThan(0);
  });

  it("clamps result between -1 and 1", () => {
    const score = analyzeSentiment("loved loved loved loved amazing amazing amazing best best best");
    expect(score).toBeLessThanOrEqual(1);
    expect(score).toBeGreaterThanOrEqual(-1);
  });
});

describe("extractThemes", () => {
  it("extracts top keywords from text", () => {
    const themes = extractThemes("The magic system in this book is incredible. The magic rules are consistent and creative. Characters use magic well.");
    expect(themes).toContain("magic");
    expect(themes.length).toBeLessThanOrEqual(5);
  });

  it("filters out stop words", () => {
    const themes = extractThemes("The book is very good and the writing is excellent");
    expect(themes).not.toContain("the");
    expect(themes).not.toContain("and");
  });

  it("only returns words longer than 3 chars", () => {
    const themes = extractThemes("the cat sat on mat");
    themes.forEach((t) => expect(t.length).toBeGreaterThan(3));
  });
});

describe("paceLabel", () => {
  it("returns human-readable labels", () => {
    expect(paceLabel("SLOW")).toBe("Slow burn");
    expect(paceLabel("MEDIUM")).toBe("Moderate");
    expect(paceLabel("FAST")).toBe("Fast-paced");
  });
});

describe("polarizationLabel", () => {
  it("returns correct label for score ranges", () => {
    expect(polarizationLabel(0.2)).toBe("Consensus pick");
    expect(polarizationLabel(0.6)).toBe("Mixed opinions");
    expect(polarizationLabel(1.0)).toBe("Divisive");
    expect(polarizationLabel(1.5)).toBe("Love/hate");
  });
});

describe("completionLabel", () => {
  it("maps completion rate to label", () => {
    expect(completionLabel(0.95)).toBe("Near universal");
    expect(completionLabel(0.8)).toBe("High");
    expect(completionLabel(0.6)).toBe("Moderate");
    expect(completionLabel(0.4)).toBe("Low");
  });
});

describe("forecastBooks", () => {
  it("returns a non-negative integer", () => {
    const forecast = forecastBooks(10);
    expect(forecast).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(forecast)).toBe(true);
  });

  it("returns 0 for 0 books last 90 days", () => {
    expect(forecastBooks(0)).toBe(0);
  });
});

describe("readingTime", () => {
  it("returns hours for short books", () => {
    expect(readingTime(100)).toBe("2 hrs");
  });

  it("returns days for very long books", () => {
    expect(readingTime(2000)).toContain("days");
  });
});
