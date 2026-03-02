import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { trackEventBackground } from "@/lib/events";
import { EventType } from "@prisma/client";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const book = await db.book.findUnique({
    where: { id },
    include: {
      reviews: {
        include: { user: { select: { id: true, name: true, username: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      bookMetrics: true,
      _count: { select: { reviews: true, shelfBooks: true } },
    },
  });

  if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });

  // Get user's shelf status
  let userShelf = null;
  if (session?.user.id) {
    userShelf = await db.shelfBook.findFirst({
      where: { userId: session.user.id, bookId: id },
      include: { shelf: true },
    });
    trackEventBackground({ userId: session.user.id, bookId: id, type: EventType.VIEW_BOOK });
  }

  // "People who finished also finished..." — collaborative completion chains
  const alsoFinished = await db.$queryRaw<Array<{ id: string; title: string; author: string; coverUrl: string | null; avgRating: number }>>`
    SELECT DISTINCT b.id, b.title, b.author, b."coverUrl", b."avgRating"
    FROM "ShelfBook" sb1
    JOIN "ShelfBook" sb2 ON sb1."userId" = sb2."userId"
    JOIN "Shelf" sh1 ON sb1."shelfId" = sh1.id
    JOIN "Shelf" sh2 ON sb2."shelfId" = sh2.id
    JOIN "Book" b ON sb2."bookId" = b.id
    WHERE sb1."bookId" = ${id}
      AND sh1.type = 'READ'
      AND sh2.type = 'READ'
      AND sb2."bookId" != ${id}
    LIMIT 6
  `;

  return NextResponse.json({ data: { ...book, userShelf, alsoFinished } });
}
