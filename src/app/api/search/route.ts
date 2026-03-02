import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const type = searchParams.get("type") ?? "all"; // all | books | users | clubs

  if (!q || q.length < 2) return NextResponse.json({ data: { books: [], users: [], clubs: [] } });

  const [books, users, clubs] = await Promise.all([
    type === "all" || type === "books"
      ? db.book.findMany({
          where: {
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { author: { contains: q, mode: "insensitive" } },
              { synopsis: { contains: q, mode: "insensitive" } },
            ],
          },
          select: { id: true, title: true, author: true, coverUrl: true, avgRating: true, genre: true },
          take: 8,
          orderBy: { ratingCount: "desc" },
        })
      : Promise.resolve([]),

    type === "all" || type === "users"
      ? db.user.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { username: { contains: q, mode: "insensitive" } },
            ],
          },
          select: { id: true, name: true, username: true, image: true },
          take: 5,
        })
      : Promise.resolve([]),

    type === "all" || type === "clubs"
      ? db.bookClub.findMany({
          where: {
            isPrivate: false,
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          },
          include: { _count: { select: { members: true } } },
          take: 5,
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({ data: { books, users, clubs } });
}
