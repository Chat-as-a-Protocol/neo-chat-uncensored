import { create } from "zustand";

export const useStore = create((set, get) => ({
  messages: [],
  user: null,
  usage: null,

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateLastMessage: (content) =>
    set((state) => ({
      messages: state.messages.map((msg, i) =>
        i === state.messages.length - 1 && msg.role === "assistant"
          ? { ...msg, content: msg.content + content }
          : msg,
      ),
    })),

  setUser: (user) => set({ user }),
  setUsage: (usage) => set({ usage }),

  clearMessages: () => set({ messages: [] }),
}));
