import { create } from 'zustand';
import type { SidebarTab } from '../types';
import { uid } from '../utils/id';

export interface ToastMessage {
  id: string;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

interface UiState {
  sidebarTab: SidebarTab;
  sidebarOpen: boolean;
  settingsOpen: boolean;
  toast: ToastMessage | null;
  setSidebarTab: (tab: SidebarTab) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  showToast: (message: string, severity?: ToastMessage['severity']) => void;
  closeToast: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarTab: 'collections',
  sidebarOpen: true,
  settingsOpen: false,
  toast: null,

  setSidebarTab: (tab) => set({ sidebarTab: tab, sidebarOpen: true }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  showToast: (message, severity = 'success') =>
    set({ toast: { id: uid('toast'), message, severity } }),
  closeToast: () => set({ toast: null }),
}));
