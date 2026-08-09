import { embeddings } from "./embedding";
import { searchDocuments } from "./search";

export async function retrieveContent(question: string) {
    const questionVector = await embeddings.embedQuery(question)

    const result = await searchDocuments(questionVector)

    console.log(result)

    return result.rows
}