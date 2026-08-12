import { retrieveContent } from "../rag/retriever";
import { llm } from "./llm";
import { createLungCancerPrompt } from "./prompt";

export async function generateAnswer(question: string) {
    const results = await retrieveContent(question);

    const context = results
        .map((result: any) => result.content)
        .join("\n\n");

    const prompt = createLungCancerPrompt(context, question)

    const response = await llm.invoke(prompt);

    console.log("Answer:");
    console.log(response.content);

    return response.content;
}
