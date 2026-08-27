import { promises as fs } from "fs"
import path from "path"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    if (!filename) {
      return new NextResponse("File name is required", { status: 400 })
    }

    const decodedFilename = decodeURIComponent(filename)
    // Sanitize to avoid directory traversal
    const safeFilename = path.basename(decodedFilename)

    if (!safeFilename.toLowerCase().endsWith(".pdf")) {
      return new NextResponse("Invalid file format. Only PDF files are supported.", {
        status: 400,
      })
    }

    const filePath = path.join(process.cwd(), "docs", safeFilename)

    try {
      await fs.access(filePath)
    } catch {
      return new NextResponse("Document not found", { status: 404 })
    }

    const fileBuffer = await fs.readFile(filePath)

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(safeFilename)}"`,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    })
  } catch (error: any) {
    console.error("Error streaming PDF file:", error)
    return new NextResponse("Failed to stream PDF file", { status: 500 })
  }
}
