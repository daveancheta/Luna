import { createClassifyRulesPrompt } from "./classify-rules";
import { llm } from "./llm";
import { createTitleRules } from "./title-rules";

export async function generateTitle(question: string) {
    const prompt = createTitleRules(question)
    const response = await llm.invoke(prompt)

    console.log(response.content)
    
    return response.content
}