import { createClassifyRulesPrompt } from "./classify-rules";
import { llm } from "./llm";

export async function classifyQuestion(question: string) {
    const prompt = createClassifyRulesPrompt(question)
    const response = await llm.invoke(prompt)

    console.log(response.content)
    
    return response.content
}