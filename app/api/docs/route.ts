import { promises as fs } from "fs"
import path from "path"
import { NextResponse } from "next/server"

export interface DocItem {
  fileName: string
  title: string
  source: string
  category: "Treatment" | "Screening" | "Prevention" | "Pediatric" | "Guidelines" | "General"
  sizeBytes: number
  sizeFormatted: string
  url: string
  description?: string
}

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function parseDocMetadata(fileName: string, sizeBytes: number): DocItem {
  let rawTitle = fileName.replace(/\.pdf$/i, "")
  let source = "Medical Reference"
  let category: DocItem["category"] = "General"
  let description = "Clinical reference documentation."

  if (rawTitle.toLowerCase().includes("nci") || rawTitle.toLowerCase().includes("pdq")) {
    source = "National Cancer Institute (PDQ®)"
    // Cleanly strip out NCI and PDQ markers from display title
    rawTitle = rawTitle
      .replace(/\s*-\s*NCI/gi, "")
      .replace(/\s*\(PDQ[^\)]*\)/gi, "")
      .trim()
  } else if (fileName.toLowerCase().includes("who")) {
    source = "World Health Organization (WHO)"
    rawTitle = "WHO Lung Cancer Factsheet & Guidelines"
    description = "Global epidemiology, prevention strategies, and diagnostic guidelines."
  }

  const title = rawTitle

  if (
    title.toLowerCase().includes("childhood") ||
    title.toLowerCase().includes("blastoma") ||
    title.toLowerCase().includes("imts") ||
    title.toLowerCase().includes("tracheobronchial")
  ) {
    category = "Pediatric"
    description = "Comprehensive pediatric oncology reference on pathology, staging, and therapeutic protocols."
  } else if (title.toLowerCase().includes("treatment")) {
    category = "Treatment"
    description = "Standard-of-care clinical management, systemic therapy, radiation, and surgical options."
  } else if (title.toLowerCase().includes("screening")) {
    category = "Screening"
    description = "Low-dose CT screening criteria, risk stratification, and early detection guidelines."
  } else if (title.toLowerCase().includes("prevention")) {
    category = "Prevention"
    description = "Etiology, tobacco cessation, occupational hazards, and protective factors."
  } else if (fileName.toLowerCase().includes("who")) {
    category = "Guidelines"
  }

  return {
    fileName,
    title,
    source,
    category,
    sizeBytes,
    sizeFormatted: formatBytes(sizeBytes),
    url: `/api/docs/${encodeURIComponent(fileName)}`,
    description,
  }
}

export async function GET() {
  try {
    const docsDirectory = path.join(process.cwd(), "docs")
    const entries = await fs.readdir(docsDirectory, { withFileTypes: true })

    const pdfFiles = entries.filter(
      (entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")
    )

    const documents: DocItem[] = await Promise.all(
      pdfFiles.map(async (file) => {
        const filePath = path.join(docsDirectory, file.name)
        const stats = await fs.stat(filePath)
        return parseDocMetadata(file.name, stats.size)
      })
    )

    // Sort documents alphabetically by title
    documents.sort((a, b) => a.title.localeCompare(b.title))

    return NextResponse.json({
      success: true,
      count: documents.length,
      documents,
    })
  } catch (error: any) {
    console.error("Error reading docs directory:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to load documents list",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}
