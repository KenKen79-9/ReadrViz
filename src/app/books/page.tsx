import { Suspense } from "react";
import { db } from "@/lib/db";
import { BookCard } from "@/components/books/BookCard";
import { BookFilters } from "@/components/books/BookFilters";
import { Skeleton } from "@/components/ui/skeleton";
import type { BookFilters as BookFiltersType } from "@/types";
import { Pace } from "@prisma/client";

interface PageProps {
  searchParams: Promise<Record<string, string | string[]>>;
}

async function BookGrid({ searchParams }: { searchParams: Record<string, string | string[]> }) {
  const query = searchParams.query as string | undefined;
  const genres = searchParams.genre ? (Array.isArray(searchParams.genre) ? searchParams.genre : [searchParams.genre]) : undefined;
  const moods = searchParams.mood ? (Array.isArray(searchParams.mood) ? searchParams.mood : [searchParams.mood]) : undefined;
  const paces = searchParams.pace ? (Array.isArray(searchParams.pace) ? searchParams.pace : [searchParams.pace]) as Pace[] : undefined;
  const page = Number(searchParams.page ?? 1);
  const pageSize = 24;
  const skip = (page - 1) * pageSize;
  const sortBy = (searchParams.sortBy as string) ?? "ratingCount";

  const where: Record<string, unknown> = {};
  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { author: { contains: query, mode: "insensitive" } },
    ];
  }
  if (genres?.length) where.genre = { hasSome: genres };
  if (moods?.length) where.mood = { hasSome: moods };
  if (paces?.length) where.pace = { in: paces };
  if (searchParams.minRating) where.avgRating = { ...(where.avgRating as object ?? {}), gte: Number(searchParams.minRating) };

  const [books, total] = await Promise.all([
    db.book.findMany({
      where,
      orderBy: { [sortBy]: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true, title: true, author: true, coverUrl: true,
        avgRating: true, ratingCount: true, completionRate: true,
        pace: true, genre: true, pageCount: true,
      },
    }),
    db.book.count({ where }),
  ]);

  if (books.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">📚</div>
        <h3 className="font-serif text-lg font-semibold text-ink mb-2">No books found</h3>
        <p className="text-sm text-ink-secondary">Try adjusting your filters or search query.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-sm text-ink-secondary mb-4">
        {total.toLocaleString()} book{total !== 1 ? "s" : ""}
        {query && <> matching <strong className="text-ink">"{query}"</strong></>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <div className="flex items-center justify-center gap-2 mt-10">
          {page > 1 && (
            <a
              href={`?${new URLSearchParams({ ...searchParams as Record<string, string>, page: String(page - 1) })}`}
              className="px-4 py-2 text-sm border border-border rounded-md hover:bg-border-subtle transition-colors"
            >
              ← Previous
            </a>
          )}
          <span className="text-sm text-ink-secondary px-4">
            Page {page} of {Math.ceil(total / pageSize)}
          </span>
          {skip + books.length < total && (
            <a
              href={`?${new URLSearchParams({ ...searchParams as Record<string, string>, page: String(page + 1) })}`}
              className="px-4 py-2 text-sm border border-border rounded-md hover:bg-border-subtle transition-colors"
            >
              Next →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function BookGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: 18 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="aspect-[2/3] rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export default async function BooksPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="page-header">
        <h1>Discover Books</h1>
        <p>Find your next read from {await db.book.count()} books in the catalog.</p>
      </div>

      <div className="mb-6">
        <BookFilters />
      </div>

      <Suspense fallback={<BookGridSkeleton />}>
        <BookGrid searchParams={params} />
      </Suspense>
    </div>
  );
}
