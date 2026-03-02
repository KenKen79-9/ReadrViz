import Link from "next/link";
import Image from "next/image";
import { Star, BookOpen, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRating, formatNumber, formatPercent, paceLabel } from "@/lib/utils";
import type { Book } from "@/types";

interface BookCardProps {
  book: Pick<Book, "id" | "title" | "author" | "coverUrl" | "avgRating" | "ratingCount" | "completionRate" | "pace" | "genre" | "pageCount">;
  variant?: "default" | "compact";
}

export function BookCard({ book, variant = "default" }: BookCardProps) {
  if (variant === "compact") {
    return (
      <Link href={`/books/${book.id}`} className="flex gap-3 group">
        <div className="w-10 h-14 rounded shrink-0 bg-border-subtle overflow-hidden shadow-card">
          {book.coverUrl ? (
            <Image src={book.coverUrl} alt={book.title} width={40} height={56} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent-light to-border">
              <BookOpen className="w-4 h-4 text-accent-muted" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-ink text-sm leading-tight group-hover:text-accent transition-colors truncate">{book.title}</div>
          <div className="text-xs text-ink-secondary mt-0.5">{book.author}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-0.5 text-xs text-ink-secondary">
              <Star className="w-3 h-3 fill-warning text-warning" />
              {formatRating(book.avgRating)}
            </span>
            {book.completionRate > 0 && (
              <span className="text-xs text-ink-tertiary">
                {formatPercent(book.completionRate)} finish
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/books/${book.id}`} className="group flex flex-col">
      {/* Cover */}
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-card group-hover:shadow-card-hover transition-shadow bg-border-subtle">
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-accent-light to-border-subtle p-4">
            <BookOpen className="w-8 h-8 text-accent-muted" />
            <span className="text-xs text-center text-ink-secondary font-medium leading-tight">{book.title}</span>
          </div>
        )}
        {/* Completion rate badge */}
        {book.completionRate > 0.85 && (
          <div className="absolute top-2 left-2">
            <div className="pill bg-success text-white gap-0.5">
              <TrendingUp className="w-2.5 h-2.5" />
              High finish
            </div>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="mt-2.5 flex-1 flex flex-col gap-1">
        <h3 className="font-serif font-semibold text-sm text-ink leading-tight group-hover:text-accent transition-colors line-clamp-2">
          {book.title}
        </h3>
        <p className="text-xs text-ink-secondary">{book.author}</p>

        <div className="flex items-center gap-2 mt-auto pt-1">
          <span className="flex items-center gap-0.5 text-xs font-medium">
            <Star className="w-3 h-3 fill-warning text-warning" />
            {formatRating(book.avgRating)}
            <span className="text-ink-tertiary font-normal ml-0.5">({formatNumber(book.ratingCount)})</span>
          </span>
          {book.pace && (
            <Badge variant="default" className="text-2xs">{paceLabel(book.pace)}</Badge>
          )}
        </div>

        {book.genre.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {book.genre.slice(0, 2).map((g) => (
              <span key={g} className="text-2xs text-ink-tertiary">{g}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
