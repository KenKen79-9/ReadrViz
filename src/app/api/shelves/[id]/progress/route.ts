import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { trackEventBackground } from "@/lib/events";
import { EventType } from "@prisma/client";

const schema = z.object({
  progress: z.number().min(0).max(100),
  pagesRead: z.number().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const data = schema.parse(body);

  const shelfBook = await db.shelfBook.findFirst({
    where: { id, userId: session.user.id },
    include: { shelf: true },
  });

  if (!shelfBook) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.shelfBook.update({
    where: { id },
    data: {
      progress: data.progress,
      pagesRead: data.pagesRead,
    },
  });

  trackEventBackground({
    userId: session.user.id,
    bookId: shelfBook.bookId,
    type: EventType.UPDATE_PROGRESS,
    properties: { progress: data.progress, pagesRead: data.pagesRead },
  });

  return NextResponse.json({ data: updated });
}
