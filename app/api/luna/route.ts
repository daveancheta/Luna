import { chats } from "@/db/schema"
import { db } from "@/index"
import { generateAnswer } from "@/lib/ai/generate"
import { auth } from "@/lib/auth"
import { randomUUID } from "crypto"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import ollama from 'ollama'

export async function POST(req: NextRequest) {
    const { prompt, title } = await req.json()
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
        let title: any = ""

        if (!title) {
            title = await ollama.chat({
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
        }

        await db.insert(chats).values({
            id: randomUUID(),
            title: title.message.content,
            userId: session.user.id,
            role: "user",
            message: prompt,
        })

        const response = await generateAnswer(prompt)

        if (response) {
            await db.insert(chats).values({
                id: randomUUID(),
                title: title.message.content,
                userId: session.user.id,
                role: "assistant",
                message: response as string,
            })
        }

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