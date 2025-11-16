'use client';

import React from 'react';
import {
  SidebarProvider,
  SidebarInset,
  SidebarRail,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { SummaryTool } from '@/components/tools/summary-tool';
import { QuizTool } from '@/components/tools/quiz-tool';
import { FlashcardsTool } from '@/components/tools/flashcards-tool';
import { AnswerTool } from '@/components/tools/answer-tool';
import { useApp } from '@/components/app-provider';
import { AppHeader } from './app-header';

export function AppContainer() {
  const { activeTool, setActiveTool } = useApp();

  const getToolComponent = () => {
    switch (activeTool) {
      case 'summary':
        return <SummaryTool />;
      case 'quiz':
        return <QuizTool />;
      case 'flashcards':
        return <FlashcardsTool />;
      case 'answer':
        return <AnswerTool />;
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar activeTool={activeTool} setActiveTool={setActiveTool} />
      <div className="flex flex-col w-full">
        <AppHeader />
        <SidebarInset>{getToolComponent()}</SidebarInset>
      </div>
      <SidebarRail />
    </SidebarProvider>
  );
}
