import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { trackEventBackground } from "@/lib/events";
import { EventType } from "@prisma/client";

export async function POST(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { username } = await params;
  const target = await db.user.findUnique({ where: { username }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === session.user.id) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  const existing = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: session.user.id, followingId: target.id } },
  });

  if (existing) {
    await db.follow.delete({ where: { id: existing.id } });
    return NextResponse.json({ following: false });
  }

  await db.follow.create({ data: { followerId: session.user.id, followingId: target.id } });
  trackEventBackground({ userId: session.user.id, type: EventType.FOLLOW_USER });
  return NextResponse.json({ following: true });
}
