import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { analyzeSentiment, extractThemes } from "@/lib/utils";

const schema = z.object({
  bookId: z.string(),
  rating: z.number().int().min(1).max(5),
  text: z.string().max(5000).optional(),
  tags: z.array(z.string()).max(10).optional(),
  hasSpoilers: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = schema.parse(body);

  const sentimentScore = data.text ? analyzeSentiment(data.text) : null;
  const themes = data.text ? extractThemes(data.text) : [];

  const review = await db.review.upsert({
    where: { userId_bookId: { userId: session.user.id, bookId: data.bookId } },
    update: {
      rating: data.rating,
      text: data.text,
      tags: data.tags ?? [],
      hasSpoilers: data.hasSpoilers ?? false,
      sentimentScore,
      themes,
    },
    create: {
      userId: session.user.id,
      bookId: data.bookId,
      rating: data.rating,
      text: data.text,
      tags: data.tags ?? [],
      hasSpoilers: data.hasSpoilers ?? false,
      sentimentScore,
      themes,
    },
    include: {
      user: { select: { id: true, name: true, username: true, image: true } },
      _count: { select: { likes: true } },
    },
  });

  // Recalculate book avg rating
  const stats = await db.review.aggregate({
    where: { bookId: data.bookId },
    _avg: { rating: true },
    _count: true,
    _stddev: { rating: true },
  });

  await db.book.update({
    where: { id: data.bookId },
    data: {
      avgRating: stats._avg.rating ?? 0,
      ratingCount: stats._count,
      polarizationScore: stats._stddev.rating ?? 0,
      reviewCount: stats._count,
    },
  });

  return NextResponse.json({ data: review }, { status: 201 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const bookId = searchParams.get("bookId");
  const session = await auth();

  if (!bookId) return NextResponse.json({ error: "bookId required" }, { status: 400 });

  const reviews = await db.review.findMany({
    where: { bookId },
    include: {
      user: { select: { id: true, name: true, username: true, image: true } },
      _count: { select: { likes: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Check if current user liked each review
  let likedIds = new Set<string>();
  if (session?.user.id) {
    const likes = await db.reviewLike.findMany({
      where: { userId: session.user.id, reviewId: { in: reviews.map((r) => r.id) } },
    });
    likedIds = new Set(likes.map((l) => l.reviewId));
  }

  return NextResponse.json({
    data: reviews.map((r) => ({ ...r, userLiked: likedIds.has(r.id) })),
  });
}
