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
    isLoading: boolean;
    auth: User | null;
    signInWithGoogle: () => Promise<void>;
    handleGetSession: () => Promise<void>;
}

export const UseAuthStore = create<AuthState>((set) => ({
    isLoading: false,
    auth: null,

    signInWithGoogle: async () => {
        await authClient.signIn.social({
            provider: "google",
        });
    },

    handleGetSession: async () => {
        try {
            const result = await fetch("/api/auth/session")

            const res = await result.json()

            set({ auth: res.session.user })
        } catch (error) {
            console.log(error)
        }
    }
}))