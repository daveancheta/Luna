import { authClient } from "@/lib/auth-client";
import { create } from "zustand";

interface AuthState {
    isLoading: boolean;
    signInWithGoogle: () => Promise<void>;
}

export const UseAuthStore = create<AuthState>((set) => ({
    isLoading: false,

    signInWithGoogle: async () => {
        await authClient.signIn.social({
            provider: "google",
        });
    }
}))