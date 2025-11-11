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
import { AnswerTool } from '@/components/tools/answer-tool';
import { useApp } from '@/components/app-provider';


export function AppContainer() {
  const { activeTool, setActiveTool } = useApp();

  return (
    <SidebarProvider>
      <div className="min-h-screen">
        <AppSidebar activeTool={activeTool} setActiveTool={setActiveTool} />
        <SidebarInset className="min-h-screen">
          {activeTool === 'summary' && <SummaryTool />}
          {activeTool === 'quiz' && <QuizTool />}
          {activeTool === 'flashcards' && <FlashcardsTool />}
          {activeTool === 'answer' && <AnswerTool />}
        </SidebarInset>
        <SidebarRail />
      </div>
    </SidebarProvider>
  );
}
