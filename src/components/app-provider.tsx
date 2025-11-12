'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

export type Tool = 'summary' | 'quiz' | 'flashcards' | 'answer';

export interface RecentItem {
  id: string;
  title: string;
  type: 'Summary' | 'Quiz' | 'Flashcards';
  time: string;
  content: string;
}

interface AppContextType {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  recents: RecentItem[];
  addRecent: (item: Omit<RecentItem, 'id' | 'time'>) => void;
  user: User | null;
  session: Session | null;
  isAuthLoading: boolean;
  globalModel: string;
  setGlobalModel: (model: string) => void;
  modelOverrides: { [key in Tool]?: string };
  setModelOverride: (tool: Tool, model: string) => void;
  clearModelOverride: (tool: Tool) => void;
  apiKeys: { openai: string; google: string; };
  setApiKey: (provider: 'openai' | 'google', key: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_RECENTS = 'studygenius_recents';
const LOCAL_STORAGE_KEY_SETTINGS = 'studygenius_settings';


export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeTool, setActiveTool] = useState<Tool>('summary');
  const [recents, setRecents] = useState<RecentItem[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Model selection state
  const [globalModel, setGlobalModel] = useState('gpt-4o-mini');
  const [modelOverrides, setModelOverrides] = useState<{ [key in Tool]?: string }>({});
  const [apiKeys, setApiKeys] = useState({ openai: '', google: ''});


  // Load settings from localStorage on initial render
  useEffect(() => {
    const savedSettings = localStorage.getItem(LOCAL_STORAGE_KEY_SETTINGS);
    if (savedSettings) {
      const { globalModel: savedGlobal, overrides, keys } = JSON.parse(savedSettings);
      if (savedGlobal) setGlobalModel(savedGlobal);
      if (overrides) setModelOverrides(overrides);
      if (keys) setApiKeys(keys);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    const settingsToSave = { 
        globalModel, 
        overrides: modelOverrides,
        keys: apiKeys
    };
    localStorage.setItem(LOCAL_STORAGE_KEY_SETTINGS, JSON.stringify(settingsToSave));
  }, [globalModel, modelOverrides, apiKeys]);

  const handleSetModelOverride = (tool: Tool, model: string) => {
    setModelOverrides(prev => ({...prev, [tool]: model}));
  }

  const handleClearModelOverride = (tool: Tool) => {
    setModelOverrides(prev => {
        const newOverrides = {...prev};
        delete newOverrides[tool];
        return newOverrides;
    });
  }

  const setApiKey = (provider: 'openai' | 'google', key: string) => {
    setApiKeys(prev => ({...prev, [provider]: key}));
  };


  // Handle auth state changes and initial load
  useEffect(() => {
    setIsAuthLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session) {
          // TODO: Fetch data from Supabase
        } else {
          // Load from localStorage for guests
          const localData = localStorage.getItem(LOCAL_STORAGE_KEY_RECENTS);
          setRecents(localData ? JSON.parse(localData) : []);
        }
        setIsAuthLoading(false);
      }
    );

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session) {
             const localData = localStorage.getItem(LOCAL_STORAGE_KEY_RECENTS);
             setRecents(localData ? JSON.parse(localData) : []);
        }
        setIsAuthLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Update localStorage whenever recents change for a guest user
  useEffect(() => {
    if (!user) {
      localStorage.setItem(LOCAL_STORAGE_KEY_RECENTS, JSON.stringify(recents));
    }
  }, [recents, user]);

  const addRecent = (item: Omit<RecentItem, 'id' | 'time'>) => {
    const newItem: RecentItem = {
      ...item,
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit'}),
    };
    
    if (user) {
        // TODO: Save to supabase
        console.log("Saving to supabase (not implemented yet)");
        setRecents(prev => [newItem, ...prev].slice(0, 10));
    } else {
        setRecents(prev => [newItem, ...prev].slice(0, 10));
    }
  };
  
  const appContextValue: AppContextType = {
    activeTool,
    setActiveTool,
    recents,
    addRecent,
    user,
    session,
    isAuthLoading,
    globalModel,
    setGlobalModel,
    modelOverrides,
    setModelOverride: handleSetModelOverride,
    clearModelOverride: handleClearModelOverride,
    apiKeys,
    setApiKey,
  };

  return (
    <AppContext.Provider value={appContextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}