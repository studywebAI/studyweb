'use client';

import React, { createContext, useContext, useState } from 'react';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [activeTool, setActiveTool] = useState<Tool>('summary');
  const [recents, setRecents] = useState<RecentItem[]>([]);

  const addRecent = (item: Omit<RecentItem, 'id' | 'time'>) => {
    const newItem: RecentItem = {
      ...item,
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit'}),
    };
    setRecents(prev => [newItem, ...prev].slice(0, 10));
  };
  
  return (
    <AppContext.Provider value={{ activeTool, setActiveTool, recents, addRecent }}>
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
