import { conversation, messages } from "@/db/schema"
import { db } from "@/index"
import { classifyQuestion } from "@/lib/ai/classify"
import { generateAnswer } from "@/lib/ai/generate"
import { auth } from "@/lib/auth"
import { randomUUID } from "crypto"
import { and, eq } from "drizzle-orm"
import { unstable_cache } from "next/cache"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import ollama from 'ollama'

export async function POST(req: NextRequest) {
    const { prompt, conversation_id } = await req.json()
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        return NextResponse.json({
            success: false,
            message: "Unauthorized, Please sign in."
        }, { status: 401 })
    }

    try {
        const classifier: any = await classifyQuestion(prompt)

        let conversationTitle: any = ""
        let conversationId = conversation_id

        if (!conversation_id) {
            conversationTitle = await ollama.chat({
                model: "llama3.2",
                messages: [
                    {
                        role: "user",
                        content: `
              Generate a short title for the following message.
              
              Rules:
              - Maximum 15 words
              - Return only the title
              - Do not include quotation marks
              - Do not include "Title:"
              - Do not add any explanation
              
              Message:
              ${prompt}
                    `.trim(),
                    },
                ],
            });

            const [newConversationID] = await db.insert(conversation).values({
                id: randomUUID(),
                title: conversationTitle.message.content,
                userId: session.user.id,
            })
                .returning({
                    id: conversation.id
                })

            conversationId = newConversationID.id
        }

        await db.insert(messages).values({
            id: randomUUID(),
            conversationId: conversation_id || conversationId,
            role: "user",
            message: prompt,
        })

        let response: any = ""

        if (classifier.toLowerCase().includes("true")) {
            response = await generateAnswer(prompt)
        } else {
            response = "I'm Luna, a lung cancer education assistant. I can only help with questions related to lung cancer, including its symptoms, risk factors, diagnosis, staging, treatment, and related medical topics. Please feel free to ask me a lung cancer-related question.";
        }

        await db.insert(messages).values({
            id: randomUUID(),
            conversationId: conversation_id || conversationId,
            role: "assistant",
            message: response as string,
        })

        return NextResponse.json({
            success: true,
            message: response
        }, { status: 200 })

    } catch (error) {
        console.log(error)

        return NextResponse.json({
            success: false,
            error: error
        }, { status: 400 })
    }
}

export async function GET() {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        return NextResponse.json({
            success: false,
            message: "Unauthorized, Please sign in."
        }, { status: 401 })
    }

    try {
        const conversationTitle = await db
            .select({
                id: conversation.id,
                title: conversation.title
            })
            .from(conversation)
            .where(eq(conversation.userId, session.user.id))


        return NextResponse.json({
            success: true,
            title: conversationTitle
        })

    } catch (error) {
        console.log(error)

        return NextResponse.json({
            success: false,
            error: error
        }, { status: 400 })
    }
}