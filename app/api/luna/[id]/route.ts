import { conversation, messages } from "@/db/schema"
import { db } from "@/index"
import { auth } from "@/lib/auth"
import { asc, eq } from "drizzle-orm"
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