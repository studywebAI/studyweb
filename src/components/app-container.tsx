'use client';

import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarRail,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { SummaryTool } from '@/components/tools/summary-tool';
import { QuizTool } from '@/components/tools/quiz-tool';
import { FlashcardsTool } from '@/components/tools/flashcards-tool';

export type Tool = 'summary' | 'quiz' | 'flashcards' | 'answer';

export function AppContainer() {
  const [activeTool, setActiveTool] = React.useState<Tool>('summary');

  return (
    <SidebarProvider>
      <div className="min-h-screen">
        <AppSidebar activeTool={activeTool} setActiveTool={setActiveTool} />
        <SidebarInset className="min-h-screen">
          {activeTool === 'summary' && <SummaryTool />}
          {activeTool === 'quiz' && <QuizTool />}
          {activeTool === 'flashcards' && <FlashcardsTool />}
          {activeTool === 'answer' && <div>Answer Tool Coming Soon</div>}
        </SidebarInset>
        <SidebarRail />
      </div>
    </SidebarProvider>
  );
}
