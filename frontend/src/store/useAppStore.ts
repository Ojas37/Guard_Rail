import { create } from 'zustand';
import { 
  MOCK_TEMPLATES, 
  MOCK_API_KEYS, 
  generateMockLogs
} from '../data/mockData';
import type { GuardrailLog, Template, ApiKey } from '../data/mockData';

interface AppState {
  logs: GuardrailLog[];
  templates: Template[];
  apiKeys: ApiKey[];
  isLiveFeedPaused: boolean;
  
  // Actions
  addLog: (log: GuardrailLog) => void;
  toggleLiveFeed: () => void;
  updateTemplate: (id: string, newConfig: Partial<Template>) => void;
  addApiKey: (key: ApiKey) => void;
  revokeApiKey: (id: string) => void;
  clearOldLogs: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  logs: generateMockLogs(500),
  templates: MOCK_TEMPLATES,
  apiKeys: MOCK_API_KEYS,
  isLiveFeedPaused: false,

  addLog: (log) => set((state) => {
    if (state.isLiveFeedPaused) return state;
    return { logs: [log, ...state.logs].slice(0, 2000) }; // Keep max 2000 logs in memory
  }),

  toggleLiveFeed: () => set((state) => ({ isLiveFeedPaused: !state.isLiveFeedPaused })),

  updateTemplate: (id, newConfig) => set((state) => ({
    templates: state.templates.map(t => t.id === id ? { ...t, ...newConfig } : t)
  })),

  addApiKey: (key) => set((state) => ({
    apiKeys: [...state.apiKeys, key]
  })),

  revokeApiKey: (id) => set((state) => ({
    apiKeys: state.apiKeys.map(k => k.id === id ? { ...k, status: 'Revoked' } : k)
  })),

  clearOldLogs: () => set((state) => {
    // mock purge logs older than 90 days (for now, simply drop everything except first 100)
    return { logs: state.logs.slice(0, 100) };
  })
}));
