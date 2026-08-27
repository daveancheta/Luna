import { and, desc, eq, ilike, ne, or } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { db } from "@/index";
import { familyRelationships, notifications, user } from "@/db/schema";
import { auth } from "@/lib/auth";

const relationships = [
  "Mother", "Father", "Spouse", "Partner", "Son", "Daughter", "Brother",
  "Sister", "Grandparent", "Relative", "Caregiver", "Other",
] as const;

const permissionFields = [
  "receiveHelpAlerts", "appointments", "medications", "healthRecords",
  "medicalReports", "healthTimeline", "location",
] as const;

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

async function createNotification(userId: string, title: string, message: string, relatedId: string) {
  await db.insert(notifications).values({
    id: randomUUID(), userId, type: "FAMILY", title, message, relatedId,
  });
}

export async function GET(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (query) {
    if (query.length < 2) return NextResponse.json({ users: [] });
    const nameTerms = query.split(/\s+/).filter(Boolean);
    const users = await db
      .select({ id: user.id, name: user.name, email: user.email, image: user.image })
      .from(user)
      .where(and(
        ne(user.id, userId),
        or(...nameTerms.map((term) => ilike(user.name, `%${term}%`))),
      ))
      .limit(50);
    return NextResponse.json({ users });
  }

  const rows = await db
    .select({ relationship: familyRelationships, requester: user })
    .from(familyRelationships)
    .innerJoin(user, eq(user.id, familyRelationships.requesterId))
    .where(eq(familyRelationships.recipientId, userId))
    .orderBy(desc(familyRelationships.createdAt));
  const outgoing = await db
    .select({ relationship: familyRelationships, recipient: user })
    .from(familyRelationships)
    .innerJoin(user, eq(user.id, familyRelationships.recipientId))
    .where(eq(familyRelationships.requesterId, userId))
    .orderBy(desc(familyRelationships.createdAt));

  return NextResponse.json({ incoming: rows, outgoing });
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const recipientId = typeof body.recipientId === "string" ? body.recipientId : "";
  const relationship = typeof body.relationship === "string" ? body.relationship : "";
  if (!recipientId || !relationships.includes(relationship as typeof relationships[number]) || recipientId === userId) {
    return NextResponse.json({ message: "Invalid family request" }, { status: 400 });
  }

  const recipient = await db.query.user.findFirst({ where: eq(user.id, recipientId) });
  if (!recipient) return NextResponse.json({ message: "User not found" }, { status: 404 });
  const existing = await db.query.familyRelationships.findFirst({
    where: and(
      or(
        and(eq(familyRelationships.requesterId, userId), eq(familyRelationships.recipientId, recipientId)),
        and(eq(familyRelationships.requesterId, recipientId), eq(familyRelationships.recipientId, userId)),
      ),
      or(eq(familyRelationships.status, "PENDING"), eq(familyRelationships.status, "ACCEPTED")),
    ),
  });
  if (existing) return NextResponse.json({ message: "A family request already exists" }, { status: 409 });

  const [created] = await db.insert(familyRelationships).values({
    id: randomUUID(), requesterId: userId, recipientId, relationship,
  }).returning();
  const requester = await db.query.user.findFirst({ where: eq(user.id, userId) });
  await createNotification(recipientId, "Family request", `${requester?.name ?? "Someone"} wants to connect with you as family.`, created.id);
  return NextResponse.json({ relationship: created }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const id = typeof body.id === "string" ? body.id : "";
  const action = typeof body.action === "string" ? body.action : "";
  const existing = await db.query.familyRelationships.findFirst({ where: eq(familyRelationships.id, id) });
  if (!existing) return NextResponse.json({ message: "Relationship not found" }, { status: 404 });

  if (action === "accept" || action === "decline") {
    if (existing.recipientId !== userId || existing.status !== "PENDING") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    const [updated] = await db.update(familyRelationships).set({
      status: action === "accept" ? "ACCEPTED" : "DECLINED",
      acceptedAt: action === "accept" ? new Date() : null,
    }).where(eq(familyRelationships.id, id)).returning();
    const actor = await db.query.user.findFirst({ where: eq(user.id, userId) });
    await createNotification(existing.requesterId, action === "accept" ? "Family request accepted" : "Family request declined", `${actor?.name ?? "Your family member"} ${action === "accept" ? "accepted" : "declined"} your family request.`, id);
    return NextResponse.json({ relationship: updated });
  }

  if (action === "cancel") {
    if (existing.requesterId !== userId || existing.status !== "PENDING") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    await db.update(familyRelationships).set({ status: "REMOVED" }).where(eq(familyRelationships.id, id));
    await createNotification(existing.recipientId, "Family request cancelled", "A family request was cancelled.", id);
    return NextResponse.json({ success: true });
  }

  if (action === "remove") {
    if (![existing.requesterId, existing.recipientId].includes(userId) || existing.status !== "ACCEPTED") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    await db.update(familyRelationships).set({ status: "REMOVED" }).where(eq(familyRelationships.id, id));
    const otherUserId = existing.requesterId === userId ? existing.recipientId : existing.requesterId;
    await createNotification(otherUserId, "Family connection removed", "A family connection was removed.", id);
    return NextResponse.json({ success: true });
  }

  if (action === "permissions") {
    if (existing.requesterId !== userId || existing.status !== "ACCEPTED") return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    const updates = Object.fromEntries(permissionFields.filter((field) => typeof body[field] === "boolean").map((field) => [field, body[field]]));
    const [updated] = await db.update(familyRelationships).set(updates).where(eq(familyRelationships.id, id)).returning();
    return NextResponse.json({ relationship: updated });
  }

  return NextResponse.json({ message: "Invalid action" }, { status: 400 });
}