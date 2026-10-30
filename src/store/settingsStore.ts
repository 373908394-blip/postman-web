import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings } from '../types';
import { DEFAULT_SETTINGS } from './defaults';

interface SettingsState {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'pmweb:settings',
      version: 1,
      // 新增字段时补齐默认值，避免老数据缺 key
      merge: (persisted, current) => {
        const persistedState = (persisted ?? {}) as Partial<SettingsState>;
        return {
          ...current,
          ...persistedState,
          settings: { ...DEFAULT_SETTINGS, ...(persistedState.settings ?? {}) },
        };
      },
    },
  ),
);
