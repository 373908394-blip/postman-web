import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RequestConfig, RequestTab, ResponseData } from '../types';
import { createTab } from './defaults';

interface TabsState {
  tabs: RequestTab[];
  activeTabId: string;
  newTab: (
    request?: RequestConfig,
    meta?: { savedRequestId?: string; collectionId?: string; name?: string },
  ) => string;
  closeTab: (id: string) => void;
  closeOtherTabs: (id: string) => void;
  setActiveTab: (id: string) => void;
  renameTab: (id: string, name: string) => void;
  updateRequest: (id: string, patch: Partial<RequestConfig>) => void;
  replaceRequest: (id: string, request: RequestConfig) => void;
  setResponse: (id: string, response: ResponseData | null) => void;
  setLoading: (id: string, loading: boolean) => void;
  setError: (id: string, error: string | null) => void;
  markSaved: (id: string, savedRequestId: string, collectionId: string, name: string) => void;
  markUnsaved: (id: string) => void;
}

const firstTab = createTab();

export const useTabsStore = create<TabsState>()(
  persist(
    (set) => ({
      tabs: [firstTab],
      activeTabId: firstTab.id,

      newTab: (request, meta) => {
        const tab = createTab(request);
        if (meta) {
          if (meta.savedRequestId) tab.savedRequestId = meta.savedRequestId;
          if (meta.collectionId) tab.collectionId = meta.collectionId;
          if (meta.name) tab.name = meta.name;
        }
        set((state) => ({ tabs: [...state.tabs, tab], activeTabId: tab.id }));
        return tab.id;
      },

      closeTab: (id) =>
        set((state) => {
          const index = state.tabs.findIndex((t) => t.id === id);
          if (index === -1) return state;
          const next = state.tabs.filter((t) => t.id !== id);
          if (!next.length) {
            const tab = createTab();
            return { tabs: [tab], activeTabId: tab.id };
          }
          const activeTabId =
            state.activeTabId === id ? next[Math.max(0, index - 1)].id : state.activeTabId;
          return { tabs: next, activeTabId };
        }),

      closeOtherTabs: (id) =>
        set((state) => {
          const keep = state.tabs.filter((t) => t.id === id);
          return { tabs: keep.length ? keep : state.tabs, activeTabId: id };
        }),

      setActiveTab: (id) => set({ activeTabId: id }),

      renameTab: (id, name) =>
        set((state) => ({
          tabs: state.tabs.map((t) => (t.id === id ? { ...t, name } : t)),
        })),

      updateRequest: (id, patch) =>
        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === id
              ? {
                  ...t,
                  request: { ...t.request, ...patch },
                  error: null,
                }
              : t,
          ),
        })),

      replaceRequest: (id, request) =>
        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === id ? { ...t, request, response: null, error: null } : t,
          ),
        })),

      setResponse: (id, response) =>
        set((state) => ({
          tabs: state.tabs.map((t) => (t.id === id ? { ...t, response, error: null } : t)),
        })),

      setLoading: (id, loading) =>
        set((state) => ({
          tabs: state.tabs.map((t) => (t.id === id ? { ...t, loading } : t)),
        })),

      setError: (id, error) =>
        set((state) => ({
          tabs: state.tabs.map((t) => (t.id === id ? { ...t, error, loading: false } : t)),
        })),

      markSaved: (id, savedRequestId, collectionId, name) =>
        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === id ? { ...t, savedRequestId, collectionId, name } : t,
          ),
        })),

      markUnsaved: (id) =>
        set((state) => ({
          tabs: state.tabs.map((t) => (t.id === id ? { ...t, savedRequestId: null } : t)),
        })),
    }),
    {
      name: 'pmweb:tabs',
      version: 1,
      // 响应体可能很大，不写入 localStorage（重开页面时按需重发）
      partialize: (state) => ({
        activeTabId: state.activeTabId,
        tabs: state.tabs.map((t) => ({ ...t, response: null, loading: false, error: null })),
      }),
      onRehydrateStorage: () => (state) => {
        if (state && !state.tabs.length) {
          const tab = createTab();
          state.tabs = [tab];
          state.activeTabId = tab.id;
        }
      },
    },
  ),
);
