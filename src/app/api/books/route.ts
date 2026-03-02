import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { BookFilters } from "@/types";
import { Pace } from "@prisma/client";

const filterSchema = z.object({
  query: z.string().optional(),
  genre: z.union([z.string(), z.array(z.string())]).optional(),
  mood: z.union([z.string(), z.array(z.string())]).optional(),
  pace: z.union([z.string(), z.array(z.string())]).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  maxRating: z.coerce.number().min(0).max(5).optional(),
  minCompletionRate: z.coerce.number().min(0).max(1).optional(),
  maxCompletionRate: z.coerce.number().min(0).max(1).optional(),
  minPages: z.coerce.number().optional(),
  maxPages: z.coerce.number().optional(),
  sortBy: z.enum(["rating", "completionRate", "ratingCount", "publishedAt", "title"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(20),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const params: Record<string, string | string[]> = {};
  searchParams.forEach((v, k) => {
    if (params[k]) {
      params[k] = Array.isArray(params[k]) ? [...(params[k] as string[]), v] : [params[k] as string, v];
    } else {
      params[k] = v;
    }
  });

  const parsed = filterSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const filters = parsed.data as BookFilters;
  const { page = 1, pageSize = 20 } = filters;
  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: Record<string, unknown> = {};

  if (filters.query) {
    where.OR = [
      { title: { contains: filters.query, mode: "insensitive" } },
      { author: { contains: filters.query, mode: "insensitive" } },
      { synopsis: { contains: filters.query, mode: "insensitive" } },
    ];
  }

  if (filters.genre?.length) {
    const genres = Array.isArray(filters.genre) ? filters.genre : [filters.genre];
    where.genre = { hasSome: genres };
  }

  if (filters.mood?.length) {
    const moods = Array.isArray(filters.mood) ? filters.mood : [filters.mood];
    where.mood = { hasSome: moods };
  }

  if (filters.pace?.length) {
    const paces = (Array.isArray(filters.pace) ? filters.pace : [filters.pace]) as Pace[];
    where.pace = { in: paces };
  }

  if (filters.minRating !== undefined) where.avgRating = { ...((where.avgRating as object) ?? {}), gte: filters.minRating };
  if (filters.maxRating !== undefined) where.avgRating = { ...((where.avgRating as object) ?? {}), lte: filters.maxRating };
  if (filters.minCompletionRate !== undefined) where.completionRate = { ...((where.completionRate as object) ?? {}), gte: filters.minCompletionRate };
  if (filters.maxCompletionRate !== undefined) where.completionRate = { ...((where.completionRate as object) ?? {}), lte: filters.maxCompletionRate };
  if (filters.minPages !== undefined) where.pageCount = { ...((where.pageCount as object) ?? {}), gte: filters.minPages };
  if (filters.maxPages !== undefined) where.pageCount = { ...((where.pageCount as object) ?? {}), lte: filters.maxPages };

  // Build orderBy
  const sortField = filters.sortBy ?? "ratingCount";
  const sortDir = filters.sortDir ?? "desc";
  const orderBy = { [sortField]: sortDir };

  const [books, total] = await Promise.all([
    db.book.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        author: true,
        coverUrl: true,
        genre: true,
        mood: true,
        pace: true,
        avgRating: true,
        ratingCount: true,
        completionRate: true,
        dnfRate: true,
        polarizationScore: true,
        pageCount: true,
        publishedAt: true,
        tags: true,
      },
    }),
    db.book.count({ where }),
  ]);

  return NextResponse.json({
    data: books,
    total,
    page,
    pageSize,
    hasMore: skip + books.length < total,
  });
}

// POST — create book (admin/import)
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const book = await db.book.create({ data: body });
  return NextResponse.json({ data: book }, { status: 201 });
}
