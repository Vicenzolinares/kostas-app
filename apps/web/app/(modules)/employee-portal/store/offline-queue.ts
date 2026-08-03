"use client";

import { create } from "zustand";
import {
  persist,
  createJSONStorage,
  type StateStorage,
} from "zustand/middleware";
import { get as idbGet, set as idbSet, del as idbDel } from "idb-keyval";
import type { QueuedEmployeeAction } from "../types";

// Zustand's `persist` middleware wants a synchronous-looking StateStorage;
// idb-keyval is promise-based, so this just adapts one to the other. This
// is what makes the queue survive an offline page reload (localStorage
// would also survive a reload, but IndexedDB scales to base64 camera
// captures much better than localStorage's ~5MB quota).
const indexedDbStorage: StateStorage = {
  getItem: async (name) => (await idbGet(name)) ?? null,
  setItem: async (name, value) => idbSet(name, value),
  removeItem: async (name) => idbDel(name),
};

interface OfflineQueueState {
  queue: QueuedEmployeeAction[];
  isSyncing: boolean;
  lastSyncedAt: string | null;
  enqueue: (
    action: Omit<QueuedEmployeeAction, "clientId"> & { clientId?: string },
  ) => void;
  dequeue: (clientIds: string[]) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSyncedAt: (iso: string) => void;
}

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set) => ({
      queue: [],
      isSyncing: false,
      lastSyncedAt: null,
      enqueue: (action) =>
        set((state) => ({
          queue: [
            ...state.queue,
            { ...action, clientId: action.clientId ?? crypto.randomUUID() },
          ],
        })),
      dequeue: (clientIds) =>
        set((state) => ({
          queue: state.queue.filter((a) => !clientIds.includes(a.clientId)),
        })),
      setSyncing: (isSyncing) => set({ isSyncing }),
      setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
    }),
    {
      name: "kostas-employee-offline-queue",
      storage: createJSONStorage(() => indexedDbStorage),
      partialize: (state) => ({
        queue: state.queue,
        lastSyncedAt: state.lastSyncedAt,
      }),
    },
  ),
);
