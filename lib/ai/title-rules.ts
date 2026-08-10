export function createTitleRules(question: string) {
    return `
Generate a short title for the following message.
              
Rules:
- Maximum 10 words
- Return only the title
- Do not include quotation marks
- Do not include "Title:"
- Do not add any explanation
                
Message:
${question}
`;
}