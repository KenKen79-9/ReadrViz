import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aggregateUserMetrics, aggregateBookMetrics } from "@/lib/analytics";

// Called nightly by a cron job (e.g., Vercel Cron, crontab, GitHub Actions)
// Protect with a shared secret in production
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[cron/aggregate] Starting nightly aggregation...");

  const [users, books] = await Promise.all([
    db.user.findMany({ select: { id: true } }),
    db.book.findMany({ select: { id: true } }),
  ]);

  await Promise.all([
    ...users.map((u) => aggregateUserMetrics(u.id).catch((e) => console.error(`User ${u.id}:`, e))),
    ...books.map((b) => aggregateBookMetrics(b.id).catch((e) => console.error(`Book ${b.id}:`, e))),
  ]);

  console.log(`[cron/aggregate] Done. Users: ${users.length}, Books: ${books.length}`);
  return NextResponse.json({ message: "Aggregation complete", users: users.length, books: books.length });
}

// Allow GET for easy cron trigger (add secret to query param in non-prod)
export async function GET(req: Request) {
  return POST(req);
}
