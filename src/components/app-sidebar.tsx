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
  LogOut,
} from 'lucide-react';
import { useApp } from './app-provider';
import { cn } from '@/lib/utils';
import { AuthDialog } from './auth-dialog';
import { SettingsDialog } from './settings-dialog';
import { Skeleton } from './ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import type { StudyTool } from './app-provider';


interface AppSidebarProps {
  activeTool: StudyTool;
  setActiveTool: (tool: StudyTool) => void;
}

const toolConfig = {
  summary: { icon: FileText, label: 'Summary' },
  answer: { icon: HelpCircle, label: 'Answer' },
  quiz: { icon: Lightbulb, label: 'Quiz' },
  flashcards: { icon: Layers, label: 'Flashcards' },
};

export function AppSidebar({ activeTool, setActiveTool }: AppSidebarProps) {
  const { sessions, session, supabase } = useApp();
  const { state } = useSidebar();
  const [isSettingsOpen, setSettingsOpen] = useState(false);


  return (
    <>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Tools</SidebarGroupLabel>
            <SidebarMenu>
              {(Object.keys(toolConfig) as StudyTool[]).map((tool) => {
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
              {!session ? (
                 <p className="text-xs text-muted-foreground text-center p-4">Login to see your session history.</p>
              ) : sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center p-4">No recent sessions yet. Create something!</p>
              ) : (
                sessions.map((item) => (
                    <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                        size="sm"
                        className="h-auto flex-col !items-start !p-2"
                        variant="ghost"
                        tooltip={{ children: item.title, side: 'right' }}
                    >
                        <span className="font-medium text-sm">{item.title}</span>
                        <span className="text-xs text-muted-foreground">{item.type} • {new Date(item.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit'})}</span>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setSettingsOpen(true)} tooltip={{ children: 'Settings', side: 'right' }}>
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
      <SettingsDialog open={isSettingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
