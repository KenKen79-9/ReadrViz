import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getHybridRecommendations } from "@/lib/recommendations";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const recommendations = await getHybridRecommendations(session.user.id, 10);
  return NextResponse.json({ data: recommendations });
}
