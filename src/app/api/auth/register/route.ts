import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

const schema = z.object({
  name: z.string().min(1).max(100),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const existing = await db.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    });

    if (existing) {
      const field = existing.email === data.email ? "email" : "username";
      return NextResponse.json({ error: `That ${field} is already taken` }, { status: 409 });
    }

    const hash = await bcrypt.hash(data.password, 12);
    const user = await db.user.create({
      data: {
        name: data.name,
        username: data.username,
        email: data.email,
        password: hash,
      },
      select: { id: true, email: true, username: true },
    });

    // Create default shelves
    await db.shelf.createMany({
      data: [
        { userId: user.id, name: "Want to Read", type: "WANT_TO_READ", isDefault: true },
        { userId: user.id, name: "Currently Reading", type: "CURRENTLY_READING", isDefault: true },
        { userId: user.id, name: "Read", type: "READ", isDefault: true },
        { userId: user.id, name: "Did Not Finish", type: "DNF", isDefault: true },
      ],
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0].message }, { status: 400 });
    }
    console.error("[register]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
