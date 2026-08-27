import { conversation, messages } from "@/db/schema"
import { db } from "@/index"
import { auth } from "@/lib/auth"
import { asc, and, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    try {
        const message = await db
            .select({
                role: messages.role,
                message: messages.message
            })
            .from(messages)
            .where(eq(messages.conversationId, id))
            .orderBy(asc(messages.createdAt))

            const title = await db
            .select({
                title: conversation.title,
            })
            .from(conversation)
            .where(eq(conversation.id, id))

        return NextResponse.json({
            success: true,
            message,
            title
        })

    } catch (error) {
        console.log(error)

        return NextResponse.json({
            success: false,
            error: error
        }, { status: 400 })
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const title = typeof body.title === "string" ? body.title.trim() : ""
    if (!title) return NextResponse.json({ message: "A conversation name is required" }, { status: 400 })

    const [updated] = await db.update(conversation)
        .set({ title })
        .where(and(eq(conversation.id, id), eq(conversation.userId, session.user.id)))
        .returning({ id: conversation.id, title: conversation.title })

    if (!updated) return NextResponse.json({ message: "Conversation not found" }, { status: 404 })
    return NextResponse.json({ success: true, conversation: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    const [deleted] = await db.delete(conversation)
        .where(and(eq(conversation.id, id), eq(conversation.userId, session.user.id)))
        .returning({ id: conversation.id })

    if (!deleted) return NextResponse.json({ message: "Conversation not found" }, { status: 404 })
    return NextResponse.json({ success: true })
}