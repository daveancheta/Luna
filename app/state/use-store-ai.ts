import { generateTitle } from "@/lib/ai/generate-title";
import { create } from "zustand";

interface Assistant {
    role: 'user' | 'assistant';
    message: string;
}

interface ConversationTitle {
    id: string;
    title: string;
    created_at: Date;
}

interface LunaState {
    isGenerating: boolean;
    isLoadingConversation: boolean;
    conversation: Assistant[];
    title: ConversationTitle[];
    conversationTitle: string | null;
    selectedTitle: string | null;
    setSelectedTitle: (selectedTitle: string | null) => void;
    selectedConversationId: string | null;
    setSelectedConversationId: (selectedConversationId: string) => void;
    generateResponse: (prompt: string, conversation_id: string, title: string) => Promise<void>;
    getConversationTitle: () => Promise<void>;
    setConversationToEmpty: () => Promise<void>;
    getConversation: (id: string) => Promise<void>;
}

export const UseAiStore = create<LunaState>((set, get) => ({
    isGenerating: false,
    isLoadingConversation: false,
    conversation: [],
    title: [],
    conversationTitle: null,
    selectedTitle: null,
    selectedConversationId: null,

    setSelectedTitle: (selectedTitle: string | null) => set({ selectedTitle: selectedTitle }),
    setSelectedConversationId: (selectedConversationId: string) => set({ selectedConversationId: selectedConversationId }),

    generateResponse: async (prompt, conversation_id, title) => {
        const trimmedPrompt = prompt.trim();
        if (!trimmedPrompt) return;
        const { setSelectedConversationId } = get()

        set((state) => ({
            isGenerating: true,
            conversation: [...state.conversation, { role: 'user', message: trimmedPrompt }],
        }))

        setSelectedConversationId(conversation_id)

        let generatedTitle: any = "";

        if (!title) {
            generatedTitle = await generateTitle(prompt)
            set({ conversationTitle: generatedTitle as string })
        } else {
            generatedTitle = title
            set({ conversationTitle: title })
        }

        try {
            const result = await fetch("/api/luna", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, conversation_id, generatedTitle }),
            })

            const response = await result.json()
            if (response.success && response.message) {
                set((state) => ({
                    conversation: [...state.conversation, { role: 'assistant', message: response.message }],
                }))
            }
        } catch (error) {
            console.log(error)
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
    },

    setConversationToEmpty: async () => {
        try {
            set({ conversation: [] })
        } catch (error) {
            console.log(error)
        }
    },

    getConversation: async (id) => {
        const { setSelectedTitle } = get()
        set({ isLoadingConversation: true })

        try {
            const result = await fetch(`/api/luna/${id}`)

            const res = await result.json()

            if (res.message?.length || get().conversation.length === 0) {
                set({ conversation: res.message ?? [] })
            }
            setSelectedTitle(res.title[0]?.title)

            console.log(res.title)
        } catch (error) {
            console.log(error)
        } finally {
            set({ isLoadingConversation: false })
        }
    }
}));    