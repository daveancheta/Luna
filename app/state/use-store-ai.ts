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
    setSelectedTitle: (selectedTitle: string) => void;
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

    setSelectedTitle: (selectedTitle: string) => set({ selectedTitle: selectedTitle }),
    setSelectedConversationId: (selectedConversationId: string) => set({ selectedConversationId: selectedConversationId }),

    generateResponse: async (prompt, conversation_id, title) => {
        const trimmedPrompt = prompt.trim();
        if (!trimmedPrompt) return;
        const { setSelectedConversationId } = get()

        setSelectedConversationId(conversation_id)

        set((state) => ({
            isGenerating: true,
            conversation: [...state.conversation, { role: 'user', message: trimmedPrompt }]
        }))

        let generatedTitle: any = "";

        if (!title) {
            generatedTitle = await generateTitle(prompt)
            set({ conversationTitle: generatedTitle as string })

            set((state) => ({
                title: [...state.title, { id: conversation_id, title: generatedTitle as string, created_at: new Date() }]
            }))
        }


        try {
            const result = await fetch("/api/luna", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, conversation_id, generatedTitle }),
            })

            const res = await result.json();
            const text = res.message;

            set((state) => ({
                isGenerating: false,
                conversation: [...state.conversation, { role: 'assistant', message: text }]
            }));

        } catch (error) {
            console.log(error)
            set((state) => ({
                isGenerating: false,
                conversation: [...state.conversation, { role: 'assistant', message: "Something went wrong. Please try again later." }]
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

            set({ conversation: res.message })
            setSelectedTitle(res.title[0]?.title)

            console.log(res.title)
        } catch (error) {
            console.log(error)
        } finally {
            set({ isLoadingConversation: false })
        }
    }
}));    