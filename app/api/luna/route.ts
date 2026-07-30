import { NextRequest, NextResponse } from "next/server"
import ollama from 'ollama'

export async function POST(req: NextRequest) {
    const { prompt } = await req.json()

    try {
        const response = await ollama.chat({
            model: 'llama3.2',
            messages: [{ role: 'user', content: prompt }],
        })

        return NextResponse.json({
            success: true,
            message: response.message.content
        }, { status: 200 })
    } catch (error) {
        console.log(error)

        return NextResponse.json({
            success: false,
            error: error
        }, { status: 400 })
    }
}