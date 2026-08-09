import { generateAnswer } from "@/lib/ai/generate"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
    const { prompt } = await req.json()

    try {
        const response = await generateAnswer(prompt)
        
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