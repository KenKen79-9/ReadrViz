import { db } from "@/lib/db";
import { EventType } from "@prisma/client";
import { forecastBooks } from "@/lib/utils";

// ─── Nightly aggregation (called by /api/cron/aggregate) ──────────────────────

export async function aggregateUserMetrics(userId: string) {
  const [allShelfBooks, events, userMetrics] = await Promise.all([
    db.shelfBook.findMany({
      where: { userId },
      include: { book: true, shelf: true },
    }),
    db.event.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    db.userMetrics.findUnique({ where: { userId } }),
  ]);

  const readBooks = allShelfBooks.filter((sb) => sb.shelf.type === "READ" && sb.finishDate);
  const dnfBooks = allShelfBooks.filter((sb) => sb.shelf.type === "DNF");
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();

  // Basic counts
  const totalBooksRead = readBooks.length;
  const totalDnf = dnfBooks.length;
  const totalPagesRead = readBooks.reduce((s, sb) => s + (sb.pagesRead ?? sb.book.pageCount ?? 0), 0);
  const booksThisYear = readBooks.filter((sb) => sb.finishDate!.getFullYear() === thisYear).length;
  const pagesThisYear = readBooks
    .filter((sb) => sb.finishDate!.getFullYear() === thisYear)
    .reduce((s, sb) => s + (sb.pagesRead ?? sb.book.pageCount ?? 0), 0);
  const pagesThisMonth = readBooks
    .filter((sb) => {
      const d = sb.finishDate!;
      return d.getFullYear() === thisYear && d.getMonth() === thisMonth;
    })
    .reduce((s, sb) => s + (sb.pagesRead ?? sb.book.pageCount ?? 0), 0);

  // Avg days to finish
  const finishTimes = readBooks
    .filter((sb) => sb.startDate && sb.finishDate)
    .map((sb) => (sb.finishDate!.getTime() - sb.startDate!.getTime()) / (1000 * 60 * 60 * 24));
  const avgDaysToFinish = finishTimes.length ? finishTimes.reduce((s, d) => s + d, 0) / finishTimes.length : 0;

  // DNF rate
  const dnfRate = totalBooksRead + totalDnf > 0 ? totalDnf / (totalBooksRead + totalDnf) : 0;

  // Genre distribution
  const genreDistribution: Record<string, number> = {};
  const completionByGenre: Record<string, { read: number; total: number }> = {};
  const dnfByGenre: Record<string, { dnf: number; total: number }> = {};

  for (const sb of allShelfBooks) {
    for (const genre of sb.book.genre) {
      genreDistribution[genre] = (genreDistribution[genre] ?? 0) + 1;
      if (!completionByGenre[genre]) completionByGenre[genre] = { read: 0, total: 0 };
      if (!dnfByGenre[genre]) dnfByGenre[genre] = { dnf: 0, total: 0 };
      completionByGenre[genre].total += 1;
      dnfByGenre[genre].total += 1;
      if (sb.shelf.type === "READ") completionByGenre[genre].read += 1;
      if (sb.shelf.type === "DNF") dnfByGenre[genre].dnf += 1;
    }
  }

  const completionByGenreFinal: Record<string, number> = {};
  for (const [genre, { read, total }] of Object.entries(completionByGenre)) {
    completionByGenreFinal[genre] = total > 0 ? read / total : 0;
  }

  const dnfByGenreFinal: Record<string, number> = {};
  for (const [genre, { dnf, total }] of Object.entries(dnfByGenre)) {
    dnfByGenreFinal[genre] = total > 0 ? dnf / total : 0;
  }

  // Cost analytics
  const paidBooks = allShelfBooks.filter((sb) => sb.costPaid != null);
  const totalSpent = paidBooks.reduce((s, sb) => s + (sb.costPaid ?? 0), 0);
  const costPerBook = paidBooks.length > 0 ? totalSpent / paidBooks.length : 0;
  const libraryBooks = allShelfBooks.filter((sb) => sb.ownership === "LIBRARY").length;
  const libraryRatio = allShelfBooks.length > 0 ? libraryBooks / allShelfBooks.length : 0;

  // Reading streak (consecutive days with a FINISH_BOOK or UPDATE_PROGRESS event)
  const progressEvents = events
    .filter((e) => e.type === EventType.FINISH_BOOK || e.type === EventType.UPDATE_PROGRESS)
    .map((e) => e.createdAt.toDateString());
  const uniqueDays = [...new Set(progressEvents)].sort();

  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  for (let i = 0; i < uniqueDays.length; i++) {
    if (i === 0) {
      streak = 1;
    } else {
      const prev = new Date(uniqueDays[i - 1]);
      const curr = new Date(uniqueDays[i]);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      streak = diff === 1 ? streak + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, streak);
    if (uniqueDays[i] === today || uniqueDays[i] === yesterday) {
      currentStreak = streak;
    }
  }

  // Avg pages per day (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const recentPages = readBooks
    .filter((sb) => sb.finishDate && sb.finishDate > thirtyDaysAgo)
    .reduce((s, sb) => s + (sb.pagesRead ?? sb.book.pageCount ?? 0), 0);
  const avgPagesPerDay = recentPages / 30;

  await db.userMetrics.upsert({
    where: { userId },
    update: {
      totalBooksRead,
      totalPagesRead,
      totalDnf,
      avgDaysToFinish,
      currentStreak,
      longestStreak,
      dnfRate,
      booksThisYear,
      pagesThisMonth,
      pagesThisYear,
      genreDistribution,
      completionByGenre: completionByGenreFinal,
      dnfByGenre: dnfByGenreFinal,
      totalSpent,
      costPerBook,
      libraryRatio,
      avgPagesPerDay,
    },
    create: {
      userId,
      totalBooksRead,
      totalPagesRead,
      totalDnf,
      avgDaysToFinish,
      currentStreak,
      longestStreak,
      dnfRate,
      booksThisYear,
      pagesThisMonth,
      pagesThisYear,
      genreDistribution,
      completionByGenre: completionByGenreFinal,
      dnfByGenre: dnfByGenreFinal,
      totalSpent,
      costPerBook,
      libraryRatio,
      avgPagesPerDay,
    },
  });
}

export async function aggregateBookMetrics(bookId: string) {
  const events = await db.event.findMany({
    where: { bookId },
    orderBy: { createdAt: "asc" },
  });

  const total = events.filter((e) => e.type === EventType.ADD_TO_SHELF).length || 1;
  const started = events.filter((e) => e.type === EventType.START_READING).length;
  const finished = events.filter((e) => e.type === EventType.FINISH_BOOK).length;
  const dnf = events.filter((e) => e.type === EventType.DNF_BOOK).length;
  const reviews = events.filter((e) => e.type === EventType.LIKE_REVIEW).length;

  const progressEvents = events.filter(
    (e) => e.type === EventType.UPDATE_PROGRESS
  );

  const reach25 = progressEvents.filter(
    (e) => ((e.properties as { progress?: number }).progress ?? 0) >= 25
  ).length;
  const reach50 = progressEvents.filter(
    (e) => ((e.properties as { progress?: number }).progress ?? 0) >= 50
  ).length;
  const reach75 = progressEvents.filter(
    (e) => ((e.properties as { progress?: number }).progress ?? 0) >= 75
  ).length;

  await db.bookMetrics.upsert({
    where: { bookId },
    update: {
      addToShelfRate: 1,
      startRate: started / total,
      reach25Rate: reach25 / total,
      reach50Rate: reach50 / total,
      reach75Rate: reach75 / total,
      completionRate: finished / total,
      reviewRate: finished > 0 ? reviews / finished : 0,
    },
    create: {
      bookId,
      addToShelfRate: 1,
      startRate: started / total,
      reach25Rate: reach25 / total,
      reach50Rate: reach50 / total,
      reach75Rate: reach75 / total,
      completionRate: finished / total,
      reviewRate: finished > 0 ? reviews / finished : 0,
    },
  });
}

// ─── Dashboard query ──────────────────────────────────────────────────────────

export async function getDashboardData(userId: string) {
  const [metrics, recentBooks, monthlyTrend, genreStats] = await Promise.all([
    db.userMetrics.findUnique({ where: { userId } }),

    db.shelfBook.findMany({
      where: { userId, shelf: { type: "READ" }, finishDate: { not: null } },
      include: { book: true },
      orderBy: { finishDate: "desc" },
      take: 12,
    }),

    // Books per month for the last 12 months
    db.$queryRaw<Array<{ month: string; count: bigint; pages: bigint }>>`
      SELECT
        TO_CHAR(sb."finishDate", 'YYYY-MM') AS month,
        COUNT(*) AS count,
        COALESCE(SUM(sb."pagesRead"), 0) AS pages
      FROM "ShelfBook" sb
      JOIN "Shelf" sh ON sb."shelfId" = sh.id
      WHERE sb."userId" = ${userId}
        AND sh.type = 'READ'
        AND sb."finishDate" >= NOW() - INTERVAL '12 months'
      GROUP BY month
      ORDER BY month ASC
    `,

    // Genre breakdown
    db.$queryRaw<Array<{ genre: string; count: bigint }>>`
      SELECT UNNEST(b.genre) AS genre, COUNT(*) AS count
      FROM "ShelfBook" sb
      JOIN "Shelf" sh ON sb."shelfId" = sh.id
      JOIN "Book" b ON sb."bookId" = b.id
      WHERE sb."userId" = ${userId}
        AND sh.type = 'READ'
      GROUP BY genre
      ORDER BY count DESC
      LIMIT 8
    `,
  ]);

  const booksLast90Days = recentBooks.filter(
    (sb) => sb.finishDate && sb.finishDate > new Date(Date.now() - 90 * 86400000)
  ).length;

  return {
    metrics,
    recentBooks,
    monthlyTrend: monthlyTrend.map((r) => ({
      month: r.month,
      books: Number(r.count),
      pages: Number(r.pages),
    })),
    genreStats: genreStats.map((r) => ({
      genre: r.genre,
      count: Number(r.count),
    })),
    forecast: {
      booksRemaining: forecastBooks(booksLast90Days),
      pace: booksLast90Days > 0 ? (booksLast90Days / 90) * 30 : 0,
    },
  };
}
