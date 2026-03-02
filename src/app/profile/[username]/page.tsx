import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BookCard } from "@/components/books/BookCard";
import { FollowButton } from "@/components/layout/FollowButton";
import { Badge } from "@/components/ui/badge";
import { formatPercent, formatNumber, daysAgo } from "@/lib/utils";
import { Star, BookOpen, Flame, Users } from "lucide-react";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;
  const user = await db.user.findUnique({ where: { username }, select: { name: true } });
  return { title: user?.name ?? username };
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;
  const session = await auth();

  const user = await db.user.findUnique({
    where: { username },
    include: {
      _count: { select: { followers: true, following: true, reviews: true } },
      metrics: true,
      shelves: {
        where: { isDefault: true },
        include: {
          books: {
            include: { book: true },
            orderBy: { updatedAt: "desc" },
            take: 6,
          },
          _count: { select: { books: true } },
        },
      },
      reviews: {
        include: { book: true },
        orderBy: { createdAt: "desc" },
        take: 4,
      },
    },
  });

  if (!user) notFound();

  const isOwnProfile = session?.user.id === user.id;
  let isFollowing = false;
  if (session?.user.id && !isOwnProfile) {
    const follow = await db.follow.findUnique({
      where: { followerId_followingId: { followerId: session.user.id, followingId: user.id } },
    });
    isFollowing = !!follow;
  }

  const readShelf = user.shelves.find((s) => s.type === "READ");
  const currentShelf = user.shelves.find((s) => s.type === "CURRENTLY_READING");
  const wantShelf = user.shelves.find((s) => s.type === "WANT_TO_READ");
  const genreDistribution = user.metrics?.genreDistribution as Record<string, number> ?? {};
  const topGenre = Object.entries(genreDistribution).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row gap-6 mb-10">
        <div className="shrink-0 flex justify-center sm:block">
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-accent-light flex items-center justify-center shadow-card">
            {user.image ? (
              <Image src={user.image} alt={user.name ?? ""} width={96} height={96} className="object-cover w-full h-full" />
            ) : (
              <span className="font-serif text-3xl font-bold text-accent">
                {(user.name ?? user.username)[0].toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h1 className="font-serif text-2xl font-bold text-ink">{user.name}</h1>
              <p className="text-ink-secondary">@{user.username}</p>
            </div>
            {!isOwnProfile && session && (
              <FollowButton username={username} initialFollowing={isFollowing} />
            )}
            {isOwnProfile && (
              <Link href="/settings" className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md text-sm text-ink-secondary hover:bg-border-subtle transition-colors">
                Edit profile
              </Link>
            )}
          </div>

          {user.bio && <p className="text-sm text-ink-secondary mt-3 max-w-lg">{user.bio}</p>}

          {/* Stats */}
          <div className="flex items-center gap-5 mt-4 flex-wrap justify-center sm:justify-start">
            {[
              { label: "books read", value: readShelf?._count.books ?? 0 },
              { label: "followers", value: user._count.followers },
              { label: "following", value: user._count.following },
              { label: "reviews", value: user._count.reviews },
            ].map(({ label, value }) => (
              <div key={label} className="text-center sm:text-left">
                <div className="font-serif font-bold text-ink">{formatNumber(value)}</div>
                <div className="text-xs text-ink-tertiary">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      {user.metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Current streak", value: `${user.metrics.currentStreak}d`, icon: Flame },
            { label: "Avg. days/book", value: user.metrics.avgDaysToFinish.toFixed(1), icon: BookOpen },
            { label: "DNF rate", value: formatPercent(user.metrics.dnfRate), icon: Star },
            { label: "Top genre", value: topGenre ?? "—", icon: Users },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="stat-card">
              <div className="flex items-center justify-between mb-1">
                <div className="stat-label">{label}</div>
                <Icon className="w-3.5 h-3.5 text-ink-tertiary" />
              </div>
              <div className="font-serif font-bold text-ink">{value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Currently reading */}
          {(currentShelf?.books.length ?? 0) > 0 && (
            <div>
              <h2 className="font-serif font-semibold text-ink mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-accent" />
                Currently reading
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {currentShelf!.books.slice(0, 3).map((sb) => (
                  <BookCard key={sb.id} book={{ ...sb.book, tags: sb.book.tags ?? [], mood: sb.book.mood ?? [] }} />
                ))}
              </div>
            </div>
          )}

          {/* Read shelf */}
          {(readShelf?.books.length ?? 0) > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-serif font-semibold text-ink">Read ({readShelf!._count.books})</h2>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {readShelf!.books.slice(0, 6).map((sb) => (
                  <BookCard key={sb.id} book={{ ...sb.book, tags: sb.book.tags ?? [], mood: sb.book.mood ?? [] }} />
                ))}
              </div>
            </div>
          )}

          {/* Recent reviews */}
          {user.reviews.length > 0 && (
            <div>
              <h2 className="font-serif font-semibold text-ink mb-3">Recent reviews</h2>
              <div className="space-y-3">
                {user.reviews.map((review) => (
                  <div key={review.id} className="bg-surface border border-border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Link href={`/books/${review.bookId}`} className="shrink-0">
                        <div className="w-10 h-14 rounded overflow-hidden bg-border-subtle shadow-sm">
                          {review.book.coverUrl && (
                            <Image src={review.book.coverUrl} alt={review.book.title} width={40} height={56} className="object-cover w-full h-full" />
                          )}
                        </div>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/books/${review.bookId}`} className="font-medium text-sm text-ink hover:text-accent">
                          {review.book.title}
                        </Link>
                        <div className="flex items-center gap-1 my-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-3 h-3 ${s <= review.rating ? "fill-warning text-warning" : "text-border"}`} />
                          ))}
                          <span className="text-xs text-ink-tertiary ml-1">{daysAgo(new Date(review.createdAt))}</span>
                        </div>
                        {review.text && (
                          <p className="text-sm text-ink-secondary line-clamp-3">{review.text}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Want to read */}
          {(wantShelf?._count.books ?? 0) > 0 && (
            <div className="bg-surface border border-border rounded-lg p-4 shadow-card">
              <h3 className="font-serif font-semibold text-ink mb-3 text-sm">
                Want to Read ({wantShelf!._count.books})
              </h3>
              <div className="space-y-2">
                {wantShelf!.books.slice(0, 4).map((sb) => (
                  <BookCard key={sb.id} book={{ ...sb.book, tags: [], mood: [] }} variant="compact" />
                ))}
              </div>
            </div>
          )}

          {/* Genre breakdown */}
          {Object.keys(genreDistribution).length > 0 && (
            <div className="bg-surface border border-border rounded-lg p-4 shadow-card">
              <h3 className="font-serif font-semibold text-ink mb-3 text-sm">Top genres</h3>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(genreDistribution)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([genre, count]) => (
                    <Badge key={genre} variant="default">
                      {genre} · {count}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
