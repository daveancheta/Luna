import { create } from "zustand";

interface SidebarState {
    sidebar: string | null;
    sidebarTrigger: (sidebar: string) => void;
}

export const UseSidebarStore = create<SidebarState>((set) => ({
    sidebar: null,

    sidebarTrigger: (sidebar: string) => set({ sidebar: sidebar })
}))