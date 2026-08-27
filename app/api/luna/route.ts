import { classifyQuestion } from "@/lib/ai/classify"
import { generateAnswer } from "@/lib/ai/generate"
import { auth } from "@/lib/auth"
import { supabase } from "@/utils/client"
import { randomUUID } from "crypto"
import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    const { prompt, conversation_id, generatedTitle } = await req.json()
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

        let conversationId = conversation_id

        const { data: isConversationIdExist, error } = await supabase
            .from("conversation")
            .select("id")
            .eq("id", conversation_id)
            .limit(1)

            console.log(isConversationIdExist)

        if (isConversationIdExist?.length === 0) {
            const { data: newConversation, error } = await supabase
                .from("conversation")
                .insert({
                    id: conversation_id,
                    title: generatedTitle,
                    user_id: session.user.id,
                })
                .select("id")
                .single();

            conversationId = newConversation?.id
        }

        const { error: errorInsertMessage } = await supabase.from('messages').insert({
            id: randomUUID(),
            conversation_id: conversation_id || conversationId,
            role: "user",
            message: prompt,
        })

        if (errorInsertMessage) {
            console.log(errorInsertMessage)
        }

        let response: any = ""

        if (classifier.toLowerCase().includes("true")) {
            response = await generateAnswer(prompt)
        } else {
            response = "I'm Luna, an AI assistant specializing in lung cancer, thoracic oncology, and pulmonary tumor education. I can help with symptoms, risk factors, diagnosis, staging, treatments (including adult and pediatric thoracic tumors), and clinical guidelines. Please feel free to ask a question related to lung cancer or thoracic oncology.";
        }

        await supabase.from('messages').insert({
            id: randomUUID(),
            conversation_id: conversation_id || conversationId,
            role: "assistant",
            message: response as string,
        })

        return NextResponse.json({
            success: true,
            message: response,
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
        const { data: conversationTitle, error } = await supabase
            .from("conversation")
            .select("id, title, created_at")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: true });


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