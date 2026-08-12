import { supabase } from "@/utils/client";

export async function searchDocuments(
  questionVector: number[]
) {
  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: questionVector,
  });

  if (error) {
    console.error("Vector search error:", error);
    throw error;
  }

  return data;
}