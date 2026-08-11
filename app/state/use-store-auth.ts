import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";
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
    isLoading: boolean;
    auth: User | null;
    signInWithGoogle: () => Promise<void>;
    handleGetSession: (isLoading: boolean) => Promise<void>;
    handleSignOutValidation: () => Promise<void>;
}

export const UseAuthStore = create<AuthState>((set) => ({
    isSession: false,
    isLoading: false,
    auth: null,

    signInWithGoogle: async () => {
        set({ isLoading: true })

        try {
            await authClient.signIn.social({
                provider: "google",
            });
        } catch (error) {
            console.log(error)
        } finally {
            set({ isLoading: true })
        }
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
    },

    handleSignOutValidation: async () => {
        try {
            await fetch("/api/auth/signout", {
                method: "POST",
                credentials: "include",
            })

            window.location.reload()
            redirect("/")
        } catch (error) {
            console.log(error)
        }
    },
}))