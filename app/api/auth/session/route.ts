import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })

    if (!session) {
        return NextResponse.json({
            success: true,
            message: "Not Authenticated :("
        }, { status: 200 })
    }

        return NextResponse.json({
            success: true,
            session,
            message: "Authenticated!"
        }, { status: 200 })
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error
        }, { status: 200 })
    }
}