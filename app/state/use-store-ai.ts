import { create } from "zustand";

interface Assistant {
    role: 'user' | 'assistant';
    content: string;
}

interface ConversationTitle {
    id: string;
    title: string;
}

interface LunaState {
    isGenerating: boolean;
    conversation: Assistant[];
    title: ConversationTitle[];
    generateResponse: (prompt: string, conversation_id: string) => Promise<void>;
    getConversationTitle: () => Promise<void>;
}

export const UseAiStore = create<LunaState>((set, get) => ({
    isGenerating: false,
    conversation: [],
    title: [],

    generateResponse: async (prompt, conversation_id) => {
        const trimmedPrompt = prompt.trim();
        if (!trimmedPrompt) return;

        set((state) => ({
            isGenerating: true,
            conversation: [...state.conversation, { role: 'user', content: trimmedPrompt }]
        }))

        try {
            const res = await fetch("/api/luna", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, conversation_id }),
            })

            const generatedResponse = await res.json();
            const text = generatedResponse.message;

            set((state) => ({
                isGenerating: false,
                conversation: [...state.conversation, { role: 'assistant', content: text }]
            }));

        } catch (error) {
            console.log(error)
            set((state) => ({
                isGenerating: false,
                conversation: [...state.conversation, { role: 'assistant', content: "Something went wrong. Please try again later." }]
            }));
        } finally {
            set({ isGenerating: false });
        }
    },

    getConversationTitle: async () => {
        try {
            const result = await fetch("/api/luna")

            const res = await result.json()

            set({ title: res.title })
        } catch (error) {
            console.log(error)
        }
    }
}));    