import { authClient } from "@/lib/auth-client";
import { create } from "zustand";

interface User {
    name: string;
    email: string;
    emailVerified: boolean;
    image: string;
    createdAt: string;
    updatedAt: string;
    birthdate: string;
    id: string;
}

interface AuthState {
    isSession: boolean;
    auth: User | null;
    signInWithGoogle: () => Promise<void>;
    handleGetSession: (isLoading: boolean) => Promise<void>;
}

export const UseAuthStore = create<AuthState>((set) => ({
    isSession: false,
    auth: null,

    signInWithGoogle: async () => {
        await authClient.signIn.social({
            provider: "google",
        });
    },

    handleGetSession: async (isLoading) => {
        if (isLoading) {
            set({ isSession: true })
        }

        try {
            const result = await fetch("/api/auth/session")

            const res = await result.json()

            set({ auth: res.session.user })
        } catch (error) {
            console.log(error)
        } finally {
            set({ isSession: false })
        }
    }
}))