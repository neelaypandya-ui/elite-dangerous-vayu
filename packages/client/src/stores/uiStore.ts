import { create } from 'zustand';

interface UIStore {
  sidebarCollapsed: boolean;
  sidebarOpen: boolean;
  activePage: string;
  theme: 'dark' | 'light';
  notifications: { id: string; type: 'info' | 'warning' | 'error' | 'success'; message: string; timestamp: string }[];
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActivePage: (page: string) => void;
  addNotification: (type: 'info' | 'warning' | 'error' | 'success', message: string) => void;
  dismissNotification: (id: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  sidebarOpen: true,
  activePage: 'dashboard',
  theme: 'dark',
  notifications: [],
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setActivePage: (activePage) => set({ activePage }),
  addNotification: (type, message) =>
    set((s) => ({
      notifications: [...s.notifications, { id: Date.now().toString(), type, message, timestamp: new Date().toISOString() }],
    })),
  dismissNotification: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
}));
