import { ChatOllama } from "@langchain/ollama";

export const llm = new ChatOllama({
    model: "llama3.2",
    baseUrl: "http://localhost:11434",
    temperature: 0,
})