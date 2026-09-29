'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchApi } from '../lib/api';
import { useAuth } from './AuthContext';

export interface Store {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  currency: string;
  botUsername?: string;
  botStatus: string;
  welcomeMessage?: string;
  supportUsername?: string;
  hasBotToken: boolean;
  owner?: { id: string; name: string; email: string };
  counts?: {
    products: number;
    orders: number;
    categories: number;
    inventoryItems: number;
    members: number;
  };
  createdAt: string;
}

interface StoreContextType {
  stores: Store[];
  activeStore: Store | null;
  loading: boolean;
  setActiveStore: (store: Store) => void;
  refreshStores: () => Promise<void>;
  createStore: (data: {
    name: string;
    slug?: string;
    currency?: string;
    botToken?: string;
    tagline?: string;
  }) => Promise<Store>;
  deleteStore: (storeId: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType>({
  stores: [],
  activeStore: null,
  loading: true,
  setActiveStore: () => {},
  refreshStores: async () => {},
  createStore: async () => ({} as any),
  deleteStore: async () => {},
});

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [activeStore, setActiveStoreState] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshStores = async () => {
    if (!user) {
      setStores([]);
      setActiveStoreState(null);
      setLoading(false);
      return;
    }

    try {
      const data = await fetchApi('/admin/stores');
      const storeList: Store[] = Array.isArray(data) ? data : [];
      setStores(storeList);

      const savedStoreId = typeof window !== 'undefined' ? localStorage.getItem('active_store_id') : null;
      let matched = storeList.find((s) => s.id === savedStoreId);

      if (!matched && storeList.length > 0) {
        matched = storeList[0];
      }

      if (matched) {
        setActiveStoreState(matched);
        if (typeof window !== 'undefined') {
          localStorage.setItem('active_store_id', matched.id);
        }
      }
    } catch (err) {
      console.error('Failed to load stores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStores();
  }, [user]);

  const setActiveStore = (store: Store) => {
    setActiveStoreState(store);
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_store_id', store.id);
    }
  };

  const createStore = async (data: {
    name: string;
    slug?: string;
    currency?: string;
    botToken?: string;
    tagline?: string;
  }) => {
    const newStore = await fetchApi('/admin/stores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    await refreshStores();
    setActiveStore(newStore);
    return newStore;
  };

  const deleteStore = async (storeId: string) => {
    await fetchApi(`/admin/stores/${storeId}`, { method: 'DELETE' });
    // If deleting the active store, switch to another
    if (activeStore?.id === storeId) {
      if (typeof window !== 'undefined') localStorage.removeItem('active_store_id');
    }
    await refreshStores();
  };

  return (
    <StoreContext.Provider
      value={{
        stores,
        activeStore,
        loading,
        setActiveStore,
        refreshStores,
        createStore,
        deleteStore,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
