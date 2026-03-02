import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { trackEventBackground } from "@/lib/events";
import { EventType } from "@prisma/client";

// GET — user's shelves with books
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shelves = await db.shelf.findMany({
    where: { userId: session.user.id },
    include: {
      books: {
        include: { book: true },
        orderBy: { updatedAt: "desc" },
      },
    },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ data: shelves });
}

// POST — add book to shelf
const addSchema = z.object({
  bookId: z.string(),
  shelfType: z.enum(["WANT_TO_READ", "CURRENTLY_READING", "READ", "DNF", "CUSTOM"]).optional(),
  shelfId: z.string().optional(),
  format: z.enum(["PHYSICAL", "EBOOK", "AUDIOBOOK"]).optional(),
  ownership: z.enum(["PURCHASED", "LIBRARY", "SUBSCRIPTION", "BORROWED", "GIFT"]).optional(),
  costPaid: z.number().optional(),
  startDate: z.string().datetime().optional(),
  finishDate: z.string().datetime().optional(),
  progress: z.number().min(0).max(100).optional(),
  pagesRead: z.number().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = addSchema.parse(body);

  // Find or resolve shelf
  let shelf;
  if (data.shelfId) {
    shelf = await db.shelf.findFirst({ where: { id: data.shelfId, userId: session.user.id } });
  } else if (data.shelfType) {
    shelf = await db.shelf.findFirst({ where: { userId: session.user.id, type: data.shelfType } });
  }

  if (!shelf) return NextResponse.json({ error: "Shelf not found" }, { status: 404 });

  // Remove from other shelves first (book can only be on one shelf at a time for default shelves)
  if (shelf.isDefault) {
    const otherDefaultShelves = await db.shelf.findMany({
      where: { userId: session.user.id, isDefault: true, id: { not: shelf.id } },
    });
    await db.shelfBook.deleteMany({
      where: {
        bookId: data.bookId,
        shelfId: { in: otherDefaultShelves.map((s) => s.id) },
      },
    });
  }

  const shelfBook = await db.shelfBook.upsert({
    where: { shelfId_bookId: { shelfId: shelf.id, bookId: data.bookId } },
    update: {
      format: data.format,
      ownership: data.ownership,
      costPaid: data.costPaid,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      finishDate: data.finishDate ? new Date(data.finishDate) : undefined,
      progress: data.progress,
      pagesRead: data.pagesRead,
    },
    create: {
      shelfId: shelf.id,
      bookId: data.bookId,
      userId: session.user.id,
      format: data.format ?? "PHYSICAL",
      ownership: data.ownership ?? "PURCHASED",
      costPaid: data.costPaid,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      finishDate: data.finishDate ? new Date(data.finishDate) : undefined,
      progress: data.progress ?? 0,
      pagesRead: data.pagesRead,
    },
    include: { book: true, shelf: true },
  });

  // Track event
  const eventType = shelf.type === "READ"
    ? EventType.FINISH_BOOK
    : shelf.type === "CURRENTLY_READING"
    ? EventType.START_READING
    : shelf.type === "DNF"
    ? EventType.DNF_BOOK
    : EventType.ADD_TO_SHELF;

  trackEventBackground({
    userId: session.user.id,
    bookId: data.bookId,
    type: eventType,
    properties: { shelfType: shelf.type, progress: data.progress },
  });

  return NextResponse.json({ data: shelfBook }, { status: 201 });
}
