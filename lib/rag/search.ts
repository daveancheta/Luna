import { sql } from "drizzle-orm";
import { db } from "@/index";

export async function searchDocuments(
  questionVector: number[],
) {
  // Convert JavaScript array to pgvector format
  const vector = `[${questionVector.join(",")}]`;

  const results = await db.execute(sql`
    SELECT
      id,
      content,
      metadata,
      1 - (embedding <=> ${vector}::vector) AS similarity
    FROM documents
    ORDER BY embedding <=> ${vector}::vector
    LIMIT 50;
  `);

  return results;
}