'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Session, User, SupabaseClient } from '@supabase/supabase-js';

export type Tool = 'summary' | 'quiz' | 'flashcards' | 'answer';

export interface StudySession {
  id: string;
  type: 'summary' | 'quiz' | 'flashcards';
  title: string;
  content: any; // Can be string for summary, object for quiz/flashcards
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
  supabase: SupabaseClient;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_SESSIONS = 'studygenius_sessions';
const LOCAL_STORAGE_KEY_SETTINGS = 'studygenius_settings';

interface AppProviderProps {
  children: React.ReactNode;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export function AppProvider({ children, supabaseUrl, supabaseAnonKey }: AppProviderProps) {
  const [supabase] = useState(() => createClient(supabaseUrl, supabaseAnonKey));
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

  // Sync local data to Supabase
  const syncLocalData = async (userId: string) => {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY_SESSIONS);
    if (localData) {
        const localSessions: StudySession[] = JSON.parse(localData);
        const unsyncedSessions = localSessions.filter(s => !s.isSynced);

        if (unsyncedSessions.length > 0) {
            const sessionsToUpload = unsyncedSessions.map(s => ({
                id: s.id,
                user_id: userId,
                type: s.type,
                title: s.title,
                content: s.content,
                created_at: new Date(s.createdAt).toISOString(),
                updated_at: new Date(s.updatedAt).toISOString(),
                is_synced: true,
            }));
            
            const { error } = await supabase.from('sessions').upsert(sessionsToUpload);

            if (error) {
                console.error("Error syncing data:", error);
            } else {
                // Mark all local sessions as synced
                 const updatedLocalSessions = localSessions.map(s => ({ ...s, isSynced: true, userId: userId }));
                 localStorage.setItem(LOCAL_STORAGE_KEY_SESSIONS, JSON.stringify(updatedLocalSessions));
            }
        }
    }
  }

  // Fetch data from Supabase for a logged-in user
  const fetchSupabaseData = async (userId: string) => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching supabase data:", error);
        return [];
    }
    
    // Map from snake_case to camelCase
    return data.map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        content: item.content,
        createdAt: new Date(item.created_at).getTime(),
        updatedAt: new Date(item.updated_at).getTime(),
        isSynced: item.is_synced,
        userId: item.user_id,
    }));
  }


  // Handle auth state changes and initial load
  useEffect(() => {
    setIsAuthLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          // User is logged in
          await syncLocalData(currentUser.id);
          const supabaseSessions = await fetchSupabaseData(currentUser.id);
          
          // Merge with any remaining local data just in case
          const localData = localStorage.getItem(LOCAL_STORAGE_KEY_SESSIONS);
          const localSessions: StudySession[] = localData ? JSON.parse(localData) : [];
          
          const combinedSessions = [...supabaseSessions];
          localSessions.forEach(localSession => {
              if(!combinedSessions.find(s => s.id === localSession.id)) {
                  combinedSessions.push(localSession);
              }
          });
          combinedSessions.sort((a,b) => b.createdAt - a.createdAt);

          setSessions(combinedSessions);
        } else {
          // User is logged out, load from localStorage for guests
          const localData = localStorage.getItem(LOCAL_STORAGE_KEY_SESSIONS);
          setSessions(localData ? JSON.parse(localData) : []);
        }
        setIsAuthLoading(false);
      }
    );

    // Check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (!currentUser) {
             const localData = localStorage.getItem(LOCAL_STORAGE_KEY_SESSIONS);
             setSessions(localData ? JSON.parse(localData) : []);
        } else {
            const supabaseSessions = await fetchSupabaseData(currentUser.id);
            setSessions(supabaseSessions);
        }
        setIsAuthLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  // Update localStorage whenever sessions change for a guest user
  useEffect(() => {
    if (!user && !isAuthLoading) {
      localStorage.setItem(LOCAL_STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    }
  }, [sessions, user, isAuthLoading]);

  const addSession = async (item: Omit<StudySession, 'id' | 'createdAt' | 'updatedAt' | 'isSynced'>) => {
    const now = Date.now();
    const newSession: StudySession = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      isSynced: !!user, // Synced if user is logged in
      userId: user?.id,
    };
    
    setSessions(prev => [newSession, ...prev]);
    
    if (user) {
        const { error } = await supabase.from('sessions').insert({
            id: newSession.id,
            user_id: user.id,
            type: newSession.type,
            title: newSession.title,
            content: newSession.content,
            created_at: new Date(newSession.createdAt).toISOString(),
            updated_at: new Date(newSession.updatedAt).toISOString(),
            is_synced: true,
        });
        if(error) {
            console.error("Error saving to supabase:", error);
            // Revert isSynced flag if save fails
            setSessions(prev => prev.map(s => s.id === newSession.id ? {...s, isSynced: false} : s));
        }
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
    supabase,
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
