import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

export function readingTime(pages: number, pagesPerHour = 50): string {
  const hours = pages / pagesPerHour;
  if (hours < 1) return `< 1 hr`;
  if (hours < 24) return `${Math.round(hours)} hrs`;
  return `${Math.round(hours / 24)} days`;
}

export function daysAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export function paceLabel(pace: string): string {
  return { SLOW: "Slow burn", MEDIUM: "Moderate", FAST: "Fast-paced" }[pace] ?? pace;
}

export function polarizationLabel(score: number): string {
  if (score < 0.4) return "Consensus pick";
  if (score < 0.8) return "Mixed opinions";
  if (score < 1.2) return "Divisive";
  return "Love/hate";
}

export function completionLabel(rate: number): string {
  if (rate >= 0.9) return "Near universal";
  if (rate >= 0.75) return "High";
  if (rate >= 0.55) return "Moderate";
  return "Low";
}

/** Forecast books by year-end given recent pace */
export function forecastBooks(booksLast90Days: number): number {
  const daysRemaining = Math.ceil(
    (new Date(new Date().getFullYear(), 11, 31).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const pacePerDay = booksLast90Days / 90;
  return Math.round(pacePerDay * daysRemaining);
}

/** Simple sentiment: positive/negative word ratio */
export function analyzeSentiment(text: string): number {
  const positiveWords = ["loved", "amazing", "brilliant", "beautiful", "perfect", "stunning", "favorite", "wonderful", "excellent", "great", "fantastic", "best", "incredible", "outstanding", "magnificent", "superb"];
  const negativeWords = ["hated", "terrible", "boring", "awful", "disappointing", "waste", "overrated", "bad", "slow", "tedious", "dull", "poor", "mediocre", "confusing"];

  const words = text.toLowerCase().split(/\W+/);
  let score = 0;
  for (const w of words) {
    if (positiveWords.includes(w)) score += 1;
    if (negativeWords.includes(w)) score -= 1;
  }
  return Math.max(-1, Math.min(1, score / (words.length * 0.1 + 1)));
}

/** Extract top keyword themes from review text */
export function extractThemes(text: string): string[] {
  const stopWords = new Set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "is", "it", "this", "that", "was", "are", "be", "been", "have", "has", "i", "me", "my", "you", "your", "we", "they", "their"]);
  const wordFreq: Record<string, number> = {};
  const words = text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);
  for (const w of words) {
    if (w.length > 3 && !stopWords.has(w)) {
      wordFreq[w] = (wordFreq[w] ?? 0) + 1;
    }
  }
  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);
}
