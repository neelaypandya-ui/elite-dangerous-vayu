import { create } from 'zustand';

interface CovasMessage {
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
}

interface CovasStore {
  messages: CovasMessage[];
  processing: boolean;
  listening: boolean;
  speaking: boolean;
  enabled: boolean;
  addMessage: (msg: CovasMessage) => void;
  setProcessing: (v: boolean) => void;
  setListening: (v: boolean) => void;
  setSpeaking: (v: boolean) => void;
  setEnabled: (v: boolean) => void;
  clearMessages: () => void;
}

export const useCovasStore = create<CovasStore>((set) => ({
  messages: [],
  processing: false,
  listening: false,
  speaking: false,
  enabled: false,
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setProcessing: (processing) => set({ processing }),
  setListening: (listening) => set({ listening }),
  setSpeaking: (speaking) => set({ speaking }),
  setEnabled: (enabled) => set({ enabled }),
  clearMessages: () => set({ messages: [] }),
}));
