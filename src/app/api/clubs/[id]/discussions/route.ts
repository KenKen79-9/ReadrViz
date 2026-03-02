import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { trackEventBackground } from "@/lib/events";
import { EventType } from "@prisma/client";

const schema = z.object({
  readingId: z.string(),
  content: z.string().min(1).max(2000),
  milestone: z.string().optional(),
  parentId: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: clubId } = await params;

  // Verify membership
  const membership = await db.clubMember.findUnique({
    where: { clubId_userId: { clubId, userId: session.user.id } },
  });
  if (!membership) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const body = await req.json();
  const data = schema.parse(body);

  const discussion = await db.discussion.create({
    data: {
      readingId: data.readingId,
      userId: session.user.id,
      content: data.content,
      milestone: data.milestone,
      parentId: data.parentId,
    },
    include: {
      user: { select: { id: true, name: true, username: true, image: true } },
      _count: { select: { likes: true, replies: true } },
    },
  });

  trackEventBackground({ userId: session.user.id, type: EventType.POST_DISCUSSION });

  return NextResponse.json({ data: discussion }, { status: 201 });
}
