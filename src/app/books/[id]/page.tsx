import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { AddToShelfButton } from "@/components/books/AddToShelfButton";
import { ReviewForm } from "@/components/books/ReviewForm";
import { BookCard } from "@/components/books/BookCard";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Star, BookOpen, TrendingUp, TrendingDown, Users, Clock } from "lucide-react";
import {
  formatRating, formatNumber, formatPercent,
  paceLabel, polarizationLabel, completionLabel, daysAgo, readingTime
} from "@/lib/utils";
import { predictFinishProbability } from "@/lib/recommendations";
import { EventType } from "@prisma/client";
import { trackEvent } from "@/lib/events";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const book = await db.book.findUnique({ where: { id }, select: { title: true, author: true } });
  if (!book) return {};
  return { title: `${book.title} by ${book.author}` };
}

export default async function BookPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  const book = await db.book.findUnique({
    where: { id },
    include: {
      reviews: {
        include: {
          user: { select: { id: true, name: true, username: true, image: true } },
          _count: { select: { likes: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      bookMetrics: true,
      _count: { select: { reviews: true } },
    },
  });

  if (!book) notFound();

  // Track view (server-side)
  if (session?.user.id) {
    trackEvent({ userId: session.user.id, bookId: id, type: EventType.VIEW_BOOK }).catch(() => {});
  }

  // User's shelf status
  let userShelf = null;
  let finishPrediction = null;

  if (session?.user.id) {
    [userShelf, finishPrediction] = await Promise.all([
      db.shelfBook.findFirst({
        where: { userId: session.user.id, bookId: id },
        include: { shelf: true },
      }),
      predictFinishProbability(session.user.id, id),
    ]);
  }

  // "Also finished" recommendations
  const alsoFinished = await db.$queryRaw<Array<{ id: string; title: string; author: string; coverUrl: string | null; avgRating: number; ratingCount: number; completionRate: number; pace: string; genre: string[]; pageCount: number | null }>>`
    SELECT DISTINCT b.id, b.title, b.author, b."coverUrl", b."avgRating", b."ratingCount", b."completionRate", b.pace::text, b.genre, b."pageCount"
    FROM "ShelfBook" sb1
    JOIN "ShelfBook" sb2 ON sb1."userId" = sb2."userId"
    JOIN "Shelf" sh1 ON sb1."shelfId" = sh1.id
    JOIN "Shelf" sh2 ON sb2."shelfId" = sh2.id
    JOIN "Book" b ON sb2."bookId" = b.id
    WHERE sb1."bookId" = ${id}
      AND sh1.type = 'READ'
      AND sh2.type = 'READ'
      AND sb2."bookId" != ${id}
    LIMIT 4
  `;

  const userReview = session?.user.id
    ? book.reviews.find((r) => r.userId === session.user.id)
    : null;

  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: book.reviews.filter((r) => r.rating === star).length,
    pct: book.reviews.length > 0 ? (book.reviews.filter((r) => r.rating === star).length / book.reviews.length) * 100 : 0,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top section */}
      <div className="flex flex-col md:flex-row gap-8 mb-10">
        {/* Cover */}
        <div className="shrink-0 flex justify-center md:block">
          <div className="w-44 md:w-52 aspect-[2/3] rounded-xl overflow-hidden shadow-elevated bg-border-subtle">
            {book.coverUrl ? (
              <Image src={book.coverUrl} alt={book.title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent-light to-border-subtle">
                <BookOpen className="w-12 h-12 text-accent-muted" />
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 mb-3">
            {book.genre.map((g) => (
              <Badge key={g} variant="accent">{g}</Badge>
            ))}
          </div>

          <h1 className="font-serif text-3xl font-bold text-ink leading-tight mb-1">{book.title}</h1>
          <p className="text-lg text-ink-secondary mb-4">by {book.author}</p>

          {/* Rating row */}
          <div className="flex items-center gap-4 mb-5 flex-wrap">
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-5 h-5 ${s <= Math.round(book.avgRating) ? "fill-warning text-warning" : "text-border"}`}
                />
              ))}
              <span className="font-serif text-xl font-bold text-ink ml-1">{formatRating(book.avgRating)}</span>
              <span className="text-sm text-ink-secondary">({formatNumber(book.ratingCount)} ratings)</span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="stat-card py-3 px-4">
              <div className="stat-label">Completion</div>
              <div className="stat-value text-base">{formatPercent(book.completionRate)}</div>
              <div className="stat-sub">{completionLabel(book.completionRate)}</div>
            </div>
            <div className="stat-card py-3 px-4">
              <div className="stat-label">DNF rate</div>
              <div className="stat-value text-base">{formatPercent(book.dnfRate)}</div>
            </div>
            <div className="stat-card py-3 px-4">
              <div className="stat-label">Pace</div>
              <div className="stat-value text-base">{paceLabel(book.pace)}</div>
            </div>
            <div className="stat-card py-3 px-4">
              <div className="stat-label">Polarization</div>
              <div className="stat-value text-base">{polarizationLabel(book.polarizationScore)}</div>
            </div>
          </div>

          {/* Book meta */}
          <div className="flex flex-wrap gap-4 text-sm text-ink-secondary mb-5">
            {book.pageCount && (
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {book.pageCount.toLocaleString()} pages · {readingTime(book.pageCount)}
              </span>
            )}
            {book.publishedAt && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(book.publishedAt).getFullYear()}
              </span>
            )}
          </div>

          {/* Finish probability */}
          {finishPrediction && (
            <div className="bg-accent-light border border-accent/20 rounded-lg p-4 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-accent">Your finish probability</span>
                <span className="font-serif font-bold text-accent">{Math.round(finishPrediction.probability * 100)}%</span>
              </div>
              <Progress value={finishPrediction.probability * 100} className="h-1.5 bg-accent/20" />
              <ul className="mt-2 space-y-0.5">
                {finishPrediction.factors.map((f) => (
                  <li key={f} className="text-xs text-accent/80">· {f}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {book.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {book.tags.map((tag) => (
                <Badge key={tag} variant="default">#{tag}</Badge>
              ))}
            </div>
          )}

          {/* Shelf button */}
          <AddToShelfButton bookId={book.id} currentShelfType={userShelf?.shelf.type ?? null} />
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({book._count.reviews})</TabsTrigger>
          <TabsTrigger value="funnel">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              {book.synopsis && (
                <div>
                  <h2 className="font-serif font-semibold text-ink mb-3">Synopsis</h2>
                  <p className="text-sm text-ink-secondary leading-relaxed whitespace-pre-line">{book.synopsis}</p>
                </div>
              )}

              {/* Mood tags */}
              {book.mood.length > 0 && (
                <div>
                  <h3 className="font-serif font-semibold text-ink mb-2">Mood</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {book.mood.map((m) => (
                      <span key={m} className="pill bg-border text-ink-secondary capitalize">{m}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Also finished sidebar */}
            {alsoFinished.length > 0 && (
              <div>
                <h3 className="font-serif font-semibold text-ink mb-3 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-ink-tertiary" />
                  Readers who finished also finished
                </h3>
                <div className="space-y-3">
                  {alsoFinished.map((b) => (
                    <BookCard key={b.id} book={{ ...b, pace: b.pace as "SLOW" | "MEDIUM" | "FAST", tags: [], mood: [], dnfRate: 0 }} variant="compact" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Reviews */}
        <TabsContent value="reviews">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              {/* Write/edit review */}
              {session && (
                <div className="bg-surface border border-border rounded-lg p-5">
                  <h3 className="font-serif font-semibold text-ink mb-4">
                    {userReview ? "Edit your review" : "Write a review"}
                  </h3>
                  <ReviewForm
                    bookId={book.id}
                    existingReview={userReview ? { rating: userReview.rating, text: userReview.text } : undefined}
                  />
                </div>
              )}

              {/* Review list */}
              <div className="space-y-4">
                {book.reviews
                  .filter((r) => r.userId !== session?.user.id)
                  .map((review) => (
                    <div key={review.id} className="bg-surface border border-border rounded-lg p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-accent-light flex items-center justify-center text-xs font-bold text-accent overflow-hidden">
                            {review.user.image ? (
                              <Image src={review.user.image} alt="" width={32} height={32} className="object-cover" />
                            ) : (
                              (review.user.name ?? review.user.username)[0].toUpperCase()
                            )}
                          </div>
                          <div>
                            <Link href={`/profile/${review.user.username}`} className="font-medium text-sm text-ink hover:text-accent">
                              {review.user.name ?? review.user.username}
                            </Link>
                            <div className="text-xs text-ink-tertiary">{daysAgo(new Date(review.createdAt))}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? "fill-warning text-warning" : "text-border"}`} />
                          ))}
                        </div>
                      </div>

                      {review.hasSpoilers && (
                        <div className="text-xs text-warning bg-warning-light rounded px-2 py-1 mb-2 inline-block">⚠ Contains spoilers</div>
                      )}

                      {review.text && (
                        <p className="text-sm text-ink-secondary leading-relaxed">{review.text}</p>
                      )}

                      {review.themes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {review.themes.map((t) => (
                            <span key={t} className="text-2xs text-ink-tertiary bg-border-subtle px-2 py-0.5 rounded-full">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                {book.reviews.length === 0 && (
                  <div className="text-center py-12 text-ink-secondary">
                    <Star className="w-8 h-8 mx-auto mb-3 text-border" />
                    <p className="text-sm">No reviews yet. Be the first!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Rating breakdown */}
            <div>
              <div className="bg-surface border border-border rounded-lg p-5">
                <h3 className="font-serif font-semibold text-ink mb-4">Rating breakdown</h3>
                <div className="space-y-2">
                  {ratingBreakdown.map(({ star, count, pct }) => (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-ink-secondary w-5 text-right">{star}</span>
                      <Star className="w-3 h-3 fill-warning text-warning shrink-0" />
                      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-warning rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-ink-tertiary w-6">{count}</span>
                    </div>
                  ))}
                </div>
                {book.polarizationScore > 0.8 && (
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-warning">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Highly polarizing — readers have strong opinions
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Funnel analytics */}
        <TabsContent value="funnel">
          <div className="max-w-2xl">
            <h2 className="font-serif font-semibold text-ink mb-6">Reading funnel</h2>
            {book.bookMetrics ? (
              <div className="space-y-3">
                {[
                  { label: "Added to any shelf", rate: 1, icon: <BookOpen className="w-4 h-4" /> },
                  { label: "Started reading", rate: book.bookMetrics.startRate, icon: <TrendingUp className="w-4 h-4" /> },
                  { label: "Reached 25%", rate: book.bookMetrics.reach25Rate, icon: null },
                  { label: "Reached 50%", rate: book.bookMetrics.reach50Rate, icon: null },
                  { label: "Reached 75%", rate: book.bookMetrics.reach75Rate, icon: null },
                  { label: "Finished", rate: book.bookMetrics.completionRate, icon: <Star className="w-4 h-4 fill-warning text-warning" /> },
                  { label: "Wrote a review", rate: book.bookMetrics.reviewRate, icon: null },
                ].map(({ label, rate, icon }) => (
                  <div key={label} className="bg-surface border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-ink">
                        {icon}
                        {label}
                      </div>
                      <span className="font-serif font-bold text-ink">{formatPercent(rate)}</span>
                    </div>
                    <Progress value={rate * 100} className="h-2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingDown className="w-8 h-8 mx-auto mb-3 text-border" />
                <p className="text-sm text-ink-secondary">Not enough data yet. Check back after more readers track this book.</p>
              </div>
            )}

            {/* Aggregated book stats */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              {[
                { label: "Total tracked", value: formatNumber(book.addToShelfCount) },
                { label: "Currently reading", value: formatNumber(book.progressCount) },
                { label: "Finished", value: formatNumber(book.completionCount) },
              ].map((s) => (
                <div key={s.label} className="stat-card text-center">
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
