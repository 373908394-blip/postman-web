import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HistoryEntry } from '../types';
import { uid } from '../utils/id';

const MAX_HISTORY = 200;

interface HistoryState {
  entries: HistoryEntry[];
  addEntry: (entry: Omit<HistoryEntry, 'id' | 'createdAt'>) => void;
  removeEntry: (id: string) => void;
  clearAll: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],

      addEntry: (entry) =>
        set((state) => {
          const next: HistoryEntry = { ...entry, id: uid('his'), createdAt: Date.now() };
          // 相同方法 + 相同地址的连续请求合并，避免刷屏
          const deduped = state.entries.filter(
            (e) => !(e.method === next.method && e.url === next.url),
          );
          return { entries: [next, ...deduped].slice(0, MAX_HISTORY) };
        }),

      removeEntry: (id) =>
        set((state) => ({ entries: state.entries.filter((e) => e.id !== id) })),

      clearAll: () => set({ entries: [] }),
    }),
    { name: 'pmweb:history', version: 1 },
  ),
);
