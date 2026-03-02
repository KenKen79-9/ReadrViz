import type {
  Book,
  User,
  Shelf,
  ShelfBook,
  Review,
  BookClub,
  ClubMember,
  ClubReading,
  Discussion,
  UserMetrics,
  BookMetrics,
  Event,
} from "@prisma/client";

// Re-export Prisma types for convenience
export type {
  Book,
  User,
  Shelf,
  ShelfBook,
  Review,
  BookClub,
  ClubMember,
  ClubReading,
  Discussion,
  UserMetrics,
  BookMetrics,
  Event,
};

// ─── Extended types ───────────────────────────────────────────────────────────

export type BookWithMeta = Book & {
  _count?: { reviews: number; shelfBooks: number };
  userShelf?: ShelfBook & { shelf: Shelf } | null;
  topReview?: Review & { user: Pick<User, "name" | "username" | "image"> } | null;
};

export type ShelfBookWithBook = ShelfBook & {
  book: Book;
  shelf: Shelf;
};

export type ReviewWithUser = Review & {
  user: Pick<User, "id" | "name" | "username" | "image">;
  _count: { likes: number };
  userLiked?: boolean;
};

export type ClubWithMeta = BookClub & {
  _count: { members: number; readings: number };
  owner: Pick<User, "id" | "name" | "username" | "image">;
  activeReading?: ClubReading & { book: Book } | null;
  userRole?: string | null;
};

export type DiscussionWithUser = Discussion & {
  user: Pick<User, "id" | "name" | "username" | "image">;
  _count: { likes: number; replies: number };
  userLiked?: boolean;
  replies?: DiscussionWithUser[];
};

// ─── API response types ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ─── Filter / search types ────────────────────────────────────────────────────

export interface BookFilters {
  query?: string;
  genre?: string[];
  mood?: string[];
  pace?: string[];
  minRating?: number;
  maxRating?: number;
  minCompletionRate?: number;
  maxCompletionRate?: number;
  minPages?: number;
  maxPages?: number;
  sortBy?: "rating" | "completionRate" | "ratingCount" | "publishedAt" | "title";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

// ─── Dashboard types ──────────────────────────────────────────────────────────

export interface MonthlyTrendPoint {
  month: string;
  books: number;
  pages: number;
}

export interface GenreStat {
  genre: string;
  count: number;
}

export interface DashboardData {
  metrics: UserMetrics | null;
  recentBooks: ShelfBookWithBook[];
  monthlyTrend: MonthlyTrendPoint[];
  genreStats: GenreStat[];
  forecast: { booksRemaining: number; pace: number };
}

// ─── Recommendation types ─────────────────────────────────────────────────────

export interface Recommendation {
  book: Book;
  score: number;
  reason: string;
}

export interface FinishPrediction {
  probability: number;
  factors: string[];
}
