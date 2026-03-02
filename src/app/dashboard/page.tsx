import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/lib/analytics";
import { getHybridRecommendations } from "@/lib/recommendations";
import { DashboardCharts } from "@/components/analytics/DashboardCharts";
import { BookCard } from "@/components/books/BookCard";
import { formatPercent, formatNumber } from "@/lib/utils";
import { BookOpen, Flame, TrendingUp, Clock, DollarSign, Target } from "lucide-react";

export const metadata = { title: "Analytics Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [data, recommendations] = await Promise.all([
    getDashboardData(session.user.id),
    getHybridRecommendations(session.user.id, 6),
  ]);

  const { metrics, monthlyTrend, genreStats, forecast, recentBooks } = data;

  const statsRow = [
    {
      label: "Books this year",
      value: metrics?.booksThisYear ?? 0,
      sub: `${metrics?.totalBooksRead ?? 0} all time`,
      icon: BookOpen,
    },
    {
      label: "Reading streak",
      value: `${metrics?.currentStreak ?? 0}d`,
      sub: `Best: ${metrics?.longestStreak ?? 0} days`,
      icon: Flame,
    },
    {
      label: "Avg. days to finish",
      value: metrics?.avgDaysToFinish ? metrics.avgDaysToFinish.toFixed(1) : "—",
      sub: "Per book",
      icon: Clock,
    },
    {
      label: "DNF rate",
      value: metrics?.dnfRate ? formatPercent(metrics.dnfRate) : "0%",
      sub: `${metrics?.totalDnf ?? 0} books DNF'd`,
      icon: TrendingUp,
    },
    {
      label: "Pages / day",
      value: metrics?.avgPagesPerDay ? Math.round(metrics.avgPagesPerDay) : "—",
      sub: `${formatNumber(metrics?.pagesThisYear ?? 0)} this year`,
      icon: Target,
    },
    {
      label: "Cost / book",
      value: metrics?.costPerBook ? `$${metrics.costPerBook.toFixed(2)}` : "—",
      sub: `${formatPercent(metrics?.libraryRatio ?? 0)} from library`,
      icon: DollarSign,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1>Reading Analytics</h1>
          <p>Your reading life, quantified.</p>
        </div>
        {forecast.booksRemaining > 0 && (
          <div className="bg-accent-light border border-accent/20 rounded-lg px-4 py-3 text-right hidden sm:block">
            <div className="text-xs text-accent font-medium">Year-end forecast</div>
            <div className="font-serif text-2xl font-bold text-accent">{(metrics?.booksThisYear ?? 0) + forecast.booksRemaining}</div>
            <div className="text-xs text-accent/80">books at current pace</div>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {statsRow.map(({ label, value, sub, icon: Icon }) => (
          <div key={label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <div className="stat-label">{label}</div>
              <Icon className="w-4 h-4 text-ink-tertiary" />
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-sub">{sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts
        monthlyTrend={monthlyTrend}
        genreStats={genreStats}
        completionByGenre={metrics?.completionByGenre as Record<string, number> ?? {}}
        dnfByGenre={metrics?.dnfByGenre as Record<string, number> ?? {}}
      />

      {/* Recent books */}
      {recentBooks.length > 0 && (
        <div className="mt-10">
          <h2 className="font-serif font-semibold text-ink mb-4">Recently read</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {recentBooks.slice(0, 6).map((sb) => (
              <BookCard
                key={sb.id}
                book={{ ...sb.book, tags: sb.book.tags ?? [], mood: sb.book.mood ?? [] }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mt-10">
          <h2 className="font-serif font-semibold text-ink mb-1">Recommended for you</h2>
          <p className="text-sm text-ink-secondary mb-4">Based on your reading history · hybrid content + collaborative filtering</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {recommendations.map(({ book, reason }) => (
              <div key={book.id} className="flex flex-col gap-1">
                <BookCard book={{ ...book, tags: book.tags ?? [], mood: book.mood ?? [] }} />
                <p className="text-2xs text-ink-tertiary leading-tight">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!metrics && (
        <div className="text-center py-20">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-border" />
          <h3 className="font-serif text-lg font-semibold text-ink mb-2">No data yet</h3>
          <p className="text-sm text-ink-secondary mb-4">Start adding books to your shelves to see your reading analytics.</p>
          <a href="/books" className="text-sm text-accent hover:underline">Browse books →</a>
        </div>
      )}
    </div>
  );
}
