import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { trackEventBackground } from "@/lib/events";
import { EventType } from "@prisma/client";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  const club = await db.bookClub.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, username: true, image: true } },
      members: {
        include: { user: { select: { id: true, name: true, username: true, image: true } } },
        orderBy: { joinedAt: "asc" },
      },
      readings: {
        include: {
          book: true,
          discussions: {
            include: {
              user: { select: { id: true, name: true, username: true, image: true } },
              _count: { select: { likes: true, replies: true } },
            },
            where: { parentId: null },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { members: true, readings: true } },
    },
  });

  if (!club) return NextResponse.json({ error: "Club not found" }, { status: 404 });

  let userRole = null;
  if (session?.user.id) {
    const membership = await db.clubMember.findUnique({
      where: { clubId_userId: { clubId: id, userId: session.user.id } },
    });
    userRole = membership?.role ?? null;
  }

  return NextResponse.json({ data: { ...club, userRole } });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action } = await req.json();

  if (action === "join") {
    const existing = await db.clubMember.findUnique({
      where: { clubId_userId: { clubId: id, userId: session.user.id } },
    });
    if (existing) return NextResponse.json({ error: "Already a member" }, { status: 409 });

    await db.clubMember.create({ data: { clubId: id, userId: session.user.id } });
    trackEventBackground({ userId: session.user.id, type: EventType.JOIN_CLUB });
    return NextResponse.json({ message: "Joined club" });
  }

  if (action === "leave") {
    await db.clubMember.delete({
      where: { clubId_userId: { clubId: id, userId: session.user.id } },
    });
    return NextResponse.json({ message: "Left club" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
