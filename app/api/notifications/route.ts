import { desc, eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/index";
import { notifications } from "@/db/schema";
import { auth } from "@/lib/auth";

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const items = await db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(20);
  return NextResponse.json({ notifications: items });
}

export async function PATCH(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : "";
  if (body.all === true) {
    await db.update(notifications).set({ isRead: true })
      .where(eq(notifications.userId, userId));
    return NextResponse.json({ success: true });
  }
  if (!id) return NextResponse.json({ message: "Notification id is required" }, { status: 400 });

  await db.update(notifications).set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  return NextResponse.json({ success: true });
}