import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/lib/analytics";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await getDashboardData(session.user.id);
  return NextResponse.json({ data });
}
