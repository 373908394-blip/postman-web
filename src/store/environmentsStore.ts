import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useMemo } from 'react';
import type { Environment, KeyValue } from '../types';
import { createEnvironment } from './defaults';
import { toVariableMap } from '../utils/variables';

interface EnvironmentsState {
  environments: Environment[];
  activeId: string | null;
  addEnvironment: (name: string) => string;
  renameEnvironment: (id: string, name: string) => void;
  removeEnvironment: (id: string) => void;
  setActiveId: (id: string | null) => void;
  setVariables: (id: string, variables: KeyValue[]) => void;
}

const seed = createEnvironment('默认环境');

export const useEnvironmentsStore = create<EnvironmentsState>()(
  persist(
    (set) => ({
      environments: [seed],
      activeId: seed.id,

      addEnvironment: (name) => {
        const env = createEnvironment(name || '新建环境');
        set((state) => ({ environments: [...state.environments, env] }));
        return env.id;
      },

      renameEnvironment: (id, name) =>
        set((state) => ({
          environments: state.environments.map((e) => (e.id === id ? { ...e, name } : e)),
        })),

      removeEnvironment: (id) =>
        set((state) => {
          const environments = state.environments.filter((e) => e.id !== id);
          const activeId = state.activeId === id ? environments[0]?.id ?? null : state.activeId;
          return { environments, activeId };
        }),

      setActiveId: (id) => set({ activeId: id }),

      setVariables: (id, variables) =>
        set((state) => ({
          environments: state.environments.map((e) => (e.id === id ? { ...e, variables } : e)),
        })),
    }),
    { name: 'pmweb:environments', version: 1 },
  ),
);

/** 当前激活的环境对象 */
export const useActiveEnvironment = (): Environment | null =>
  useEnvironmentsStore((state) => state.environments.find((e) => e.id === state.activeId) ?? null);

/** 当前环境的变量字典（memo 化，避免每次渲染都产生新对象） */
export const useActiveVariables = (): Record<string, string> => {
  const env = useActiveEnvironment();
  return useMemo(() => toVariableMap(env), [env]);
};
