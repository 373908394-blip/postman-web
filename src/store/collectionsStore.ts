import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Collection, RequestConfig, SavedRequest } from '../types';
import { createCollection } from './defaults';
import { uid } from '../utils/id';

interface CollectionsState {
  collections: Collection[];
  addCollection: (name: string) => string;
  renameCollection: (id: string, name: string) => void;
  removeCollection: (id: string) => void;
  addRequest: (collectionId: string, name: string, request: RequestConfig) => string;
  updateSavedRequest: (collectionId: string, savedId: string, patch: Partial<SavedRequest>) => void;
  removeRequest: (collectionId: string, savedId: string) => void;
  duplicateRequest: (collectionId: string, savedId: string) => void;
  importCollection: (collection: Collection) => void;
}

const now = () => Date.now();

export const useCollectionsStore = create<CollectionsState>()(
  persist(
    (set) => ({
      collections: [
        {
          id: uid('col'),
          name: '示例集合',
          description: '内置的公开测试接口，开箱即用',
          createdAt: now(),
          requests: [
            {
              id: uid('saved'),
              name: 'GET 文章列表',
              createdAt: now(),
              updatedAt: now(),
              request: {
                id: uid('req'),
                name: 'GET 文章列表',
                method: 'GET',
                url: 'https://jsonplaceholder.typicode.com/posts',
                params: [
                  { id: uid('kv'), key: '_limit', value: '10', enabled: true },
                  { id: uid('kv'), key: '', value: '', enabled: true },
                ],
                headers: [
                  { id: uid('kv'), key: 'Accept', value: 'application/json', enabled: true },
                ],
                bodyType: 'none',
                rawBody: '',
                formData: [],
                auth: {
                  type: 'none',
                  token: '',
                  username: '',
                  password: '',
                  key: '',
                  value: '',
                  addTo: 'header',
                },
              },
            },
          ],
        },
      ],

      addCollection: (name) => {
        const collection = createCollection(name || '新建集合');
        set((state) => ({ collections: [...state.collections, collection] }));
        return collection.id;
      },

      renameCollection: (id, name) =>
        set((state) => ({
          collections: state.collections.map((c) => (c.id === id ? { ...c, name } : c)),
        })),

      removeCollection: (id) =>
        set((state) => ({ collections: state.collections.filter((c) => c.id !== id) })),

      addRequest: (collectionId, name, request) => {
        const saved: SavedRequest = {
          id: uid('saved'),
          name: name || request.name || '未命名请求',
          request: { ...request, name: name || request.name },
          createdAt: now(),
          updatedAt: now(),
        };
        set((state) => ({
          collections: state.collections.map((c) =>
            c.id === collectionId ? { ...c, requests: [...c.requests, saved] } : c,
          ),
        }));
        return saved.id;
      },

      updateSavedRequest: (collectionId, savedId, patch) =>
        set((state) => ({
          collections: state.collections.map((c) =>
            c.id === collectionId
              ? {
                  ...c,
                  requests: c.requests.map((r) =>
                    r.id === savedId ? { ...r, ...patch, updatedAt: now() } : r,
                  ),
                }
              : c,
          ),
        })),

      removeRequest: (collectionId, savedId) =>
        set((state) => ({
          collections: state.collections.map((c) =>
            c.id === collectionId
              ? { ...c, requests: c.requests.filter((r) => r.id !== savedId) }
              : c,
          ),
        })),

      duplicateRequest: (collectionId, savedId) =>
        set((state) => ({
          collections: state.collections.map((c) => {
            if (c.id !== collectionId) return c;
            const source = c.requests.find((r) => r.id === savedId);
            if (!source) return c;
            const copy: SavedRequest = {
              ...source,
              id: uid('saved'),
              name: `${source.name} 副本`,
              request: { ...source.request, id: uid('req') },
              createdAt: now(),
              updatedAt: now(),
            };
            return { ...c, requests: [...c.requests, copy] };
          }),
        })),

      importCollection: (collection) =>
        set((state) => ({ collections: [...state.collections, collection] })),
    }),
    { name: 'pmweb:collections', version: 1 },
  ),
);
