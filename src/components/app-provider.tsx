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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'studygenius_recents';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeTool, setActiveTool] = useState<Tool>('summary');
  const [recents, setRecents] = useState<RecentItem[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

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
          const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
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
             const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
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
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(recents));
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
  
  return (
    <AppContext.Provider value={{ activeTool, setActiveTool, recents, addRecent, user, session, isAuthLoading }}>
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
