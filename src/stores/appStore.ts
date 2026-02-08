import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { APIKey, User, UsageRecord, DailyUsage } from '@/types';
import { STORAGE_KEYS } from '@/constants/config';
import { mockAPIKeys, mockUser, mockUsageRecords, mockDailyUsage } from '@/constants/mockData';
import { generateAPIKey, hashAPIKey, generateId } from '@/lib/utils';

interface AppState {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  
  // API Keys state
  apiKeys: APIKey[];
  createAPIKey: (name: string) => { key: APIKey; fullKey: string };
  revokeAPIKey: (id: string) => void;
  deleteAPIKey: (id: string) => void;
  
  // Usage state
  usageRecords: UsageRecord[];
  dailyUsage: DailyUsage[];
  addUsageRecord: (record: Omit<UsageRecord, 'id'>) => void;
  
  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User state
      user: mockUser,
      setUser: (user) => set({ user }),
      
      // API Keys state
      apiKeys: mockAPIKeys,
      createAPIKey: (name) => {
        const fullKey = generateAPIKey();
        const keyPrefix = fullKey.slice(0, 20);
        const keyHash = hashAPIKey(fullKey);
        
        const newKey: APIKey = {
          id: generateId(),
          name,
          keyPrefix,
          keyHash,
          createdAt: new Date().toISOString(),
          usageCount: 0,
          status: 'active',
        };
        
        set((state) => ({
          apiKeys: [newKey, ...state.apiKeys],
        }));
        
        return { key: newKey, fullKey };
      },
      revokeAPIKey: (id) => {
        set((state) => ({
          apiKeys: state.apiKeys.map((key) =>
            key.id === id ? { ...key, status: 'revoked' as const } : key
          ),
        }));
      },
      deleteAPIKey: (id) => {
        set((state) => ({
          apiKeys: state.apiKeys.filter((key) => key.id !== id),
        }));
      },
      
      // Usage state
      usageRecords: mockUsageRecords,
      dailyUsage: mockDailyUsage,
      addUsageRecord: (record) => {
        const newRecord: UsageRecord = {
          ...record,
          id: generateId(),
        };
        set((state) => ({
          usageRecords: [newRecord, ...state.usageRecords],
        }));
      },
      
      // UI state
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: STORAGE_KEYS.API_KEYS,
      partialize: (state) => ({
        apiKeys: state.apiKeys,
        usageRecords: state.usageRecords,
      }),
    }
  )
);
