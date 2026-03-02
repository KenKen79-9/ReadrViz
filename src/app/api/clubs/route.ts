import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { trackEventBackground } from "@/lib/events";
import { EventType } from "@prisma/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "";
  const mine = searchParams.get("mine") === "true";
  const session = await auth();

  const where: Record<string, unknown> = {};

  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }

  if (mine && session?.user.id) {
    where.members = { some: { userId: session.user.id } };
  } else {
    where.isPrivate = false;
  }

  const clubs = await db.bookClub.findMany({
    where,
    include: {
      owner: { select: { id: true, name: true, username: true, image: true } },
      _count: { select: { members: true, readings: true } },
      readings: {
        where: { isActive: true },
        include: { book: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  // Add user role if authenticated
  let userRoles: Record<string, string> = {};
  if (session?.user.id) {
    const memberships = await db.clubMember.findMany({
      where: { userId: session.user.id, clubId: { in: clubs.map((c) => c.id) } },
    });
    userRoles = Object.fromEntries(memberships.map((m) => [m.clubId, m.role]));
  }

  return NextResponse.json({
    data: clubs.map((c) => ({
      ...c,
      activeReading: c.readings[0] ?? null,
      userRole: userRoles[c.id] ?? null,
    })),
  });
}

const createSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data = createSchema.parse(body);

  const club = await db.bookClub.create({
    data: {
      ...data,
      ownerId: session.user.id,
      members: {
        create: { userId: session.user.id, role: "OWNER" },
      },
    },
    include: {
      owner: { select: { id: true, name: true, username: true, image: true } },
      _count: { select: { members: true, readings: true } },
    },
  });

  trackEventBackground({ userId: session.user.id, type: EventType.JOIN_CLUB });

  return NextResponse.json({ data: club }, { status: 201 });
}
