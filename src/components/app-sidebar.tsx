'use client';
import React, { useState } from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  useSidebar,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from './ui/button';
import {
  FileText,
  Lightbulb,
  Layers,
  HelpCircle,
  Settings,
  Bot,
  Clock,
  LogIn,
} from 'lucide-react';
import type { Tool } from './app-provider';
import { useApp } from './app-provider';
import { cn } from '@/lib/utils';
import { AuthDialog } from './auth-dialog';
import { Skeleton } from './ui/skeleton';


interface AppSidebarProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
}

const toolConfig = {
  summary: { icon: FileText, label: 'Summary' },
  answer: { icon: HelpCircle, label: 'Answer' },
  quiz: { icon: Lightbulb, label: 'Quiz' },
  flashcards: { icon: Layers, label: 'Flashcards' },
};

export function AppSidebar({ activeTool, setActiveTool }: AppSidebarProps) {
  const { recents, user, isAuthLoading } = useApp();
  const { state } = useSidebar();
  const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);
  
  const AuthContent = () => {
    if (isAuthLoading) {
        return <Skeleton className="h-8 w-full" />
    }
    
    if (!user) {
        return (
            <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setAuthDialogOpen(true)} tooltip={{ children: 'Sign In', side: 'right' }}>
                  <LogIn />
                  <span>Sign In</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        )
    }

    return null; // For now, we don't show anything for logged-in user, per instructions
  }

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <div className={cn("flex items-center gap-2", state === 'collapsed' && 'justify-center')}>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Bot className="h-6 w-6 text-primary" />
            </Button>
            <div className={cn("flex flex-col", state === 'collapsed' && 'hidden')}>
              <span className="font-headline text-lg font-semibold tracking-tighter">
                StudyGeniusAI
              </span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Tools</SidebarGroupLabel>
            <SidebarMenu>
              {(Object.keys(toolConfig) as Tool[]).map((tool) => {
                const { icon: Icon, label } = toolConfig[tool];
                return (
                  <SidebarMenuItem key={tool}>
                    <SidebarMenuButton
                      onClick={() => setActiveTool(tool)}
                      isActive={activeTool === tool}
                      tooltip={{ children: label, side: 'right' }}
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
          <SidebarSeparator />
          <SidebarGroup>
             <SidebarGroupLabel className="flex items-center gap-2">
              <Clock className="h-4 w-4"/>
              Recents
            </SidebarGroupLabel>
            <SidebarMenu>
              {isAuthLoading ? (
                Array.from({length: 3}).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
              ) : recents.map((item) => (
                 <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                      size="sm"
                      className="h-auto flex-col !items-start !p-2"
                      variant="ghost"
                      tooltip={{ children: item.title, side: 'right' }}
                  >
                      <span className="font-medium text-sm">{item.title}</span>
                      <span className="text-xs text-muted-foreground">{item.type} • {item.time}</span>
                  </SidebarMenuButton>
                 </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
             {/* This is intentionally not shown yet per instructions */}
             {/* <AuthContent /> */}
            <SidebarMenuItem>
              <SidebarMenuButton tooltip={{ children: 'Settings', side: 'right' }}>
                <Settings />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <SidebarTrigger />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <AuthDialog open={isAuthDialogOpen} onOpenChange={setAuthDialogOpen} />
    </>
  );
}
