'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

export type Tool = 'summary' | 'quiz' | 'flashcards' | 'answer';

export interface StudySession {
  id: string;
  type: 'summary' | 'quiz' | 'flashcards';
  title: string;
  content: string | object;
  createdAt: number;
  updatedAt: number;
  isSynced: boolean;
  userId?: string;
}

interface AppContextType {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  sessions: StudySession[];
  addSession: (item: Omit<StudySession, 'id' | 'createdAt' | 'updatedAt' | 'isSynced'>) => void;
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

const LOCAL_STORAGE_KEY_SESSIONS = 'studygenius_sessions';
const LOCAL_STORAGE_KEY_SETTINGS = 'studygenius_settings';


export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeTool, setActiveTool] = useState<Tool>('summary');
  const [sessions, setSessions] = useState<StudySession[]>([]);
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
          // TODO: Fetch data from Supabase and merge with local
        } else {
          // Load from localStorage for guests
          const localData = localStorage.getItem(LOCAL_STORAGE_KEY_SESSIONS);
          setSessions(localData ? JSON.parse(localData) : []);
        }
        setIsAuthLoading(false);
      }
    );

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (!session) {
             const localData = localStorage.getItem(LOCAL_STORAGE_KEY_SESSIONS);
             setSessions(localData ? JSON.parse(localData) : []);
        }
        setIsAuthLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Update localStorage whenever sessions change for a guest user
  useEffect(() => {
    if (!user) {
      localStorage.setItem(LOCAL_STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    }
  }, [sessions, user]);

  const addSession = (item: Omit<StudySession, 'id' | 'createdAt' | 'updatedAt' | 'isSynced'>) => {
    const now = Date.now();
    const newSession: StudySession = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      isSynced: !!user, // Synced if user is logged in
      userId: user?.id,
    };
    
    if (user) {
        // TODO: Save to supabase
        console.log("Saving to supabase (not implemented yet)");
        setSessions(prev => [newSession, ...prev]);
    } else {
        setSessions(prev => [newSession, ...prev]);
    }
  };
  
  const appContextValue: AppContextType = {
    activeTool,
    setActiveTool,
    sessions,
    addSession,
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
