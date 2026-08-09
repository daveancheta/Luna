import { OllamaEmbeddings } from "@langchain/ollama";
import { splitter } from "./splitter"
import { db } from "@/index";
import { documents } from "@/db/schema";
import { randomUUID } from "crypto";

export const embeddings = new OllamaEmbeddings({
    model: "nomic-embed-text",
    baseUrl: "http://localhost:11434",
});

export async function createEmbeddings() {
    const chunks = await splitter()
    const vectors = await embeddings.embedDocuments(chunks);

    const rows = chunks.map((chunk, index) => ({
        id: randomUUID(),
        content: chunk,
        embedding: vectors[index],
        metadata: {
            source: "who-lung-cancer.pdf"
        }
    }))

    await db.insert(documents).values(rows)

    console.log(vectors)

    return vectors;
}

createEmbeddings()