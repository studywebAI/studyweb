'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { AuthDialog } from './auth-dialog';

// --- Types ---
export type StudyTool = 'summary' | 'flashcards' | 'quiz' | 'answer';

export interface StudySession {
  id: string;
  user_id: string;
  created_at: string;
  title: string;
  type: StudyTool;
  source_text: string; // The original text used to generate the content
  content: any; // JSONB content (e.g., { cards: [...] } or { questions: [...] } or "summary text")
}

export type GlobalModel = 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo' | 'gpt-4' | 'gemini-1.5-pro-latest' | 'gemini-1.5-flash-latest';

export interface ModelOverrides {
  summary: GlobalModel | null;
  flashcards: GlobalModel | null;
  quiz: GlobalModel | null;
  answer: GlobalModel | null;
}

export interface ApiKeys {
  openai: string | null;
  google: string | null;
}

interface AppContextType {
  supabase: SupabaseClient;
  session: Session | null;
  sessions: StudySession[];
  isSessionsLoading: boolean;
  addSession: (sessionData: Omit<StudySession, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  globalModel: GlobalModel;
  setGlobalModel: (model: GlobalModel) => void;
  modelOverrides: ModelOverrides;
  setModelOverrides: (overrides: Partial<ModelOverrides>) => void;
  setModelOverride: (tool: StudyTool, model: GlobalModel | null) => void;
  clearModelOverride: (tool: StudyTool) => void;
  apiKeys: ApiKeys;
  setApiKeys: (keys: Partial<ApiKeys>) => void;
  setApiKey: (provider: keyof ApiKeys, key: string) => void;
  activeTool: StudyTool;
  setActiveTool: (tool: StudyTool) => void;
  isSettingsLoaded: boolean;
  isAuthDialogOpen: boolean;
  setAuthDialogOpen: (open: boolean) => void;
}

// --- Context ---
const AppContext = createContext<AppContextType | undefined>(undefined);

// --- Provider ---
export function AppProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [session, setSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = useState(true);
  const { toast } = useToast();
  
  const [activeTool, setActiveTool] = useState<StudyTool>('summary');
  const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);

  // State for settings
  const [globalModel, setGlobalModel] = useState<GlobalModel>('gemini-1.5-flash-latest');
  const [modelOverrides, setModelOverrides] = useState<ModelOverrides>({ summary: null, flashcards: null, quiz: null, answer: null });
  const [apiKeys, setApiKeys] = useState<ApiKeys>({ openai: '', google: '' });
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

  
  // --- Effects ---
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (session) {
      fetchSessions();
    } else {
      setSessions([]);
      setIsSessionsLoading(false);
    }
  }, [session]);

  // Load settings from localStorage on client-side mount
  useEffect(() => {
    try {
        const savedGlobalModel = localStorage.getItem('globalModel');
        if (savedGlobalModel) setGlobalModel(savedGlobalModel as GlobalModel);

        const savedModelOverrides = localStorage.getItem('modelOverrides');
        if (savedModelOverrides) setModelOverrides(JSON.parse(savedModelOverrides));

        const savedApiKeys = localStorage.getItem('apiKeys');
        if (savedApiKeys) setApiKeys(JSON.parse(savedApiKeys));

    } catch (error) {
        console.error("Failed to load settings from localStorage", error);
        toast({ title: "Could not load settings", description: "Your settings from a previous session could not be loaded.", variant: "destructive" });
    } finally {
        setIsSettingsLoaded(true);
    }
  }, [toast]);

  // Save settings to localStorage when they change
  useEffect(() => { if(isSettingsLoaded) localStorage.setItem('globalModel', globalModel); }, [globalModel, isSettingsLoaded]);
  useEffect(() => { if(isSettingsLoaded) localStorage.setItem('modelOverrides', JSON.stringify(modelOverrides)); }, [modelOverrides, isSettingsLoaded]);
  useEffect(() => { if(isSettingsLoaded) localStorage.setItem('apiKeys', JSON.stringify(apiKeys)); }, [apiKeys, isSettingsLoaded]);

  // --- Data Functions ---
  const fetchSessions = async () => {
    if (!session) return;
    setIsSessionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      toast({ title: "Error", description: "Could not fetch your saved sessions.", variant: "destructive" });
    } finally {
        setIsSessionsLoading(false);
    }
  };

  const addSession = async (sessionData: Omit<StudySession, 'id' | 'user_id' | 'created_at'>) => {
    if (!session) return;
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert([{ ...sessionData, user_id: session.user.id }])
        .select();
      if (error) throw error;
      if (data) {
        setSessions(prev => [data[0], ...prev]);
      }
    } catch (error: any) {
      console.error('Error adding session:', error);
      toast({ title: "Error", description: "Could not save your session.", variant: "destructive" });
    }
  };

  const deleteSession = async (id: string) => {
    try {
        const { error } = await supabase.from('sessions').delete().match({ id });
        if (error) throw error;
        setSessions(prev => prev.filter(s => s.id !== id));
    } catch (error: any) {
        console.error('Error deleting session:', error);
        toast({ title: "Error", description: "Could not delete session.", variant: "destructive" });
    }
  };
  
  const setApiKey = (provider: keyof ApiKeys, key: string) => {
    setApiKeys(prev => ({...prev, [provider]: key}));
  };

  const setModelOverride = (tool: StudyTool, model: GlobalModel | null) => {
    setModelOverrides(prev => ({ ...prev, [tool]: model }));
  };

  const clearModelOverride = (tool: StudyTool) => {
    setModelOverrides(prev => ({ ...prev, [tool]: null }));
  }

  // --- Memoized Value ---
  const value = useMemo(() => ({
    supabase,
    session,
    sessions,
    isSessionsLoading,
    addSession,
    deleteSession,
    globalModel,
    setGlobalModel,
    modelOverrides,
    setModelOverrides,
    setModelOverride,
    clearModelOverride,
    apiKeys,
    setApiKeys,
    setApiKey,
    activeTool,
    setActiveTool,
    isSettingsLoaded,
    isAuthDialogOpen,
    setAuthDialogOpen,
  }), [supabase, session, sessions, isSessionsLoading, globalModel, modelOverrides, apiKeys, activeTool, isSettingsLoaded, isAuthDialogOpen]);

  return (
    <AppContext.Provider value={value}>
        {children}
        <AuthDialog />
    </AppContext.Provider>
  );
}

// --- Hook ---
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
