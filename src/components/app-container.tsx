'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import {
  SidebarProvider,
  SidebarInset,
  SidebarRail,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { useApp } from '@/components/app-provider';
import { Loader2 } from 'lucide-react';

// Dynamically import the tools with SSR turned off.
// This means they will only be rendered on the client side.
const SummaryTool = dynamic(() => import('@/components/tools/summary-tool').then(mod => mod.SummaryTool), { 
    ssr: false,
    loading: () => <ToolLoadingSpinner />
});
const QuizTool = dynamic(() => import('@/components/tools/quiz-tool').then(mod => mod.QuizTool), { 
    ssr: false,
    loading: () => <ToolLoadingSpinner />
});
const FlashcardsTool = dynamic(() => import('@/components/tools/flashcards-tool').then(mod => mod.FlashcardsTool), { 
    ssr: false,
    loading: () => <ToolLoadingSpinner />
});
const AnswerTool = dynamic(() => import('@/components/tools/answer-tool').then(mod => mod.AnswerTool), { 
    ssr: false,
    loading: () => <ToolLoadingSpinner />
});

const ToolLoadingSpinner = () => (
    <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
);

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
        <SidebarInset>
          {getToolComponent()}
        </SidebarInset>
      </div>
      <SidebarRail />
    </SidebarProvider>
  );
}
