import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { loadPDF } from "./loader"


export async function splitter() {
    const document = await loadPDF()

    const fullText = document.map(d => d.pageContent).join("\n\n")

    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 800, chunkOverlap: 100 })

    const chunks = await textSplitter.splitText(fullText)
    console.log("Chunks:", chunks)

    return chunks
}

splitter()