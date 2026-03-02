import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: reviewId } = await params;

  const existing = await db.reviewLike.findUnique({
    where: { reviewId_userId: { reviewId, userId: session.user.id } },
  });

  if (existing) {
    await db.reviewLike.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  }

  await db.reviewLike.create({ data: { reviewId, userId: session.user.id } });
  return NextResponse.json({ liked: true });
}
