import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const session = await auth();

  const user = await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
      createdAt: true,
      _count: {
        select: {
          followers: true,
          following: true,
          reviews: true,
        },
      },
      metrics: true,
      shelves: {
        where: { isDefault: true },
        include: {
          books: {
            include: { book: true },
            orderBy: { updatedAt: "desc" },
            take: 6,
          },
          _count: { select: { books: true } },
        },
      },
      reviews: {
        include: { book: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let isFollowing = false;
  if (session?.user.id && session.user.id !== user.id) {
    const follow = await db.follow.findUnique({
      where: { followerId_followingId: { followerId: session.user.id, followingId: user.id } },
    });
    isFollowing = !!follow;
  }

  return NextResponse.json({ data: { ...user, isFollowing } });
}
