import { db } from "@/lib/db";
import type { Book } from "@prisma/client";

// ─── TF-IDF style feature vector ─────────────────────────────────────────────

type FeatureVector = Record<string, number>;

function buildFeatureVector(book: Pick<Book, "genre" | "tags" | "mood" | "pace">): FeatureVector {
  const vec: FeatureVector = {};
  const add = (items: string[], weight: number) => {
    for (const item of items) {
      const key = item.toLowerCase().replace(/\s+/g, "_");
      vec[key] = (vec[key] ?? 0) + weight;
    }
  };
  add(book.genre, 3);
  add(book.mood, 2);
  add(book.tags, 1);
  add([book.pace], 2);
  return vec;
}

function cosineSimilarity(a: FeatureVector, b: FeatureVector): number {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0, magA = 0, magB = 0;
  for (const k of keys) {
    const va = a[k] ?? 0;
    const vb = b[k] ?? 0;
    dot += va * vb;
    magA += va * va;
    magB += vb * vb;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// ─── Content-based recommendations ───────────────────────────────────────────

export async function getContentBasedRecommendations(
  userId: string,
  limit = 8
): Promise<Array<{ book: Book; score: number; reason: string }>> {
  // Get all books user has on READ shelf
  const readBooks = await db.shelfBook.findMany({
    where: { userId, shelf: { type: "READ" } },
    include: { book: true },
    take: 20,
    orderBy: { finishDate: "desc" },
  });

  if (readBooks.length === 0) return [];

  // Build user preference vector from recently read books
  const userVec: FeatureVector = {};
  for (const sb of readBooks) {
    const vec = buildFeatureVector(sb.book);
    for (const [k, v] of Object.entries(vec)) {
      userVec[k] = (userVec[k] ?? 0) + v;
    }
  }

  // Get books user hasn't read
  const readBookIds = readBooks.map((sb) => sb.bookId);
  const candidates = await db.book.findMany({
    where: { id: { notIn: readBookIds } },
    take: 100,
  });

  // Score candidates
  const scored = candidates.map((book) => {
    const vec = buildFeatureVector(book);
    const score = cosineSimilarity(userVec, vec);

    // Build why explanation
    const matchedGenres = book.genre.filter((g) => readBooks.some((rb) => rb.book.genre.includes(g)));
    const matchedMood = book.mood.filter((m) => readBooks.some((rb) => rb.book.mood.includes(m)));
    let reason = "Matches your reading taste";
    if (matchedGenres.length > 0) reason = `You enjoy ${matchedGenres[0]}`;
    if (matchedMood.length > 0) reason += ` · ${matchedMood[0]} tone`;

    return { book, score, reason };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ─── Collaborative filtering ──────────────────────────────────────────────────

export async function getCollaborativeRecommendations(
  userId: string,
  limit = 8
): Promise<Array<{ book: Book; score: number; reason: string }>> {
  // Find users who have read similar books
  const userReadIds = await db.shelfBook
    .findMany({ where: { userId, shelf: { type: "READ" } } })
    .then((r) => r.map((sb) => sb.bookId));

  if (userReadIds.length === 0) return [];

  // Find users who have read at least 2 of the same books
  const similarUserIds = await db.shelfBook
    .groupBy({
      by: ["userId"],
      where: {
        bookId: { in: userReadIds },
        userId: { not: userId },
        shelf: { type: "READ" },
      },
      _count: { bookId: true },
      having: { bookId: { _count: { gte: 2 } } },
      orderBy: { _count: { bookId: "desc" } },
      take: 20,
    })
    .then((r) => r.map((row) => row.userId));

  if (similarUserIds.length === 0) return [];

  // Get books those users have read that our user hasn't
  const theirBooks = await db.shelfBook.findMany({
    where: {
      userId: { in: similarUserIds },
      bookId: { notIn: userReadIds },
      shelf: { type: "READ" },
    },
    include: { book: true },
  });

  // Count frequency of each book across similar users
  const freq: Record<string, { book: Book; count: number }> = {};
  for (const sb of theirBooks) {
    if (!freq[sb.bookId]) freq[sb.bookId] = { book: sb.book, count: 0 };
    freq[sb.bookId].count += 1;
  }

  return Object.values(freq)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(({ book, count }) => ({
      book,
      score: Math.min(count / similarUserIds.length, 1),
      reason: `${count} readers like you also finished this`,
    }));
}

// ─── Finish probability ───────────────────────────────────────────────────────

export async function predictFinishProbability(
  userId: string,
  bookId: string
): Promise<{ probability: number; factors: string[] }> {
  const [book, userMetrics] = await Promise.all([
    db.book.findUnique({ where: { id: bookId } }),
    db.userMetrics.findUnique({ where: { userId } }),
  ]);

  if (!book || !userMetrics) return { probability: 0.75, factors: ["Baseline estimate"] };

  let prob = 0.75; // base
  const factors: string[] = [];

  // Genre match with user's completion rate
  const completionByGenre = userMetrics.completionByGenre as Record<string, number>;
  for (const genre of book.genre) {
    if (completionByGenre[genre]) {
      prob = completionByGenre[genre];
      factors.push(`You finish ${Math.round(prob * 100)}% of ${genre} books`);
      break;
    }
  }

  // Page count penalty for long books if user's avg DNF is on long books
  if (book.pageCount && book.pageCount > 500 && userMetrics.dnfRate > 0.15) {
    prob -= 0.08;
    factors.push("Long book — you DNF more on 500+ page reads");
  }

  // Book's own completion rate
  if (book.completionRate > 0.85) {
    prob += 0.05;
    factors.push(`${Math.round(book.completionRate * 100)}% of readers finish this`);
  } else if (book.completionRate < 0.55) {
    prob -= 0.10;
    factors.push(`Only ${Math.round(book.completionRate * 100)}% of readers finish this`);
  }

  // Pace match
  if (book.pace === "FAST") {
    prob += 0.03;
    factors.push("Fast-paced — tends to hook readers in");
  } else if (book.pace === "SLOW" && userMetrics.avgDaysToFinish > 25) {
    prob -= 0.05;
    factors.push("Slow burn — takes patience");
  }

  return {
    probability: Math.max(0.1, Math.min(0.97, prob)),
    factors: factors.slice(0, 3),
  };
}

// ─── Hybrid merge ─────────────────────────────────────────────────────────────

export async function getHybridRecommendations(userId: string, limit = 10) {
  const [contentBased, collaborative] = await Promise.all([
    getContentBasedRecommendations(userId, 20),
    getCollaborativeRecommendations(userId, 20),
  ]);

  // Merge: combine scores with 60/40 content/collaborative weighting
  const merged = new Map<string, { book: Book; score: number; reason: string }>();

  for (const r of contentBased) {
    merged.set(r.book.id, { ...r, score: r.score * 0.6 });
  }
  for (const r of collaborative) {
    const existing = merged.get(r.book.id);
    if (existing) {
      existing.score += r.score * 0.4;
      existing.reason = `${r.reason} · ${existing.reason}`;
    } else {
      merged.set(r.book.id, { ...r, score: r.score * 0.4 });
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
