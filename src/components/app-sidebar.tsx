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
import type { Tool } from './app-provider';
import { useApp } from './app-provider';
import { cn } from '@/lib/utils';
import { AuthDialog } from './auth-dialog';
import { SettingsDialog } from './settings-dialog';
import { Skeleton } from './ui/skeleton';
import { supabase } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';


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
  const { sessions, user, isAuthLoading } = useApp();
  const { state } = useSidebar();
  const [isAuthDialogOpen, setAuthDialogOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  }
  
  const AuthContent = () => {
    if (isAuthLoading) {
        return (
            <SidebarMenuItem>
                 <div className="flex items-center gap-2 w-full p-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className={cn("h-6 flex-grow", state === 'collapsed' && 'hidden')} />
                </div>
            </SidebarMenuItem>
        )
    }
    
    if (!user) {
        return (
            <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setAuthDialogOpen(true)} tooltip={{ children: 'Login / Sign Up', side: 'right' }}>
                  <LogIn />
                  <span>Login</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        )
    }

    return (
        <SidebarMenuItem>
            <div className={cn("flex items-center w-full p-2 gap-2", state === 'collapsed' && 'justify-center')}>
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata.avatar_url} alt={user.email} />
                    <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className={cn("flex-grow overflow-hidden", state === 'collapsed' && 'hidden')}>
                    <p className="text-sm font-medium truncate">{user.user_metadata.name || user.email}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4"/>
                </Button>
            </div>
        </SidebarMenuItem>
    );
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
                        <span className="text-xs text-muted-foreground">{item.type} • {new Date(item.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit'})}</span>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
             <AuthContent />
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
      <AuthDialog open={isAuthDialogOpen} onOpenChange={setAuthDialogOpen} />
      <SettingsDialog open={isSettingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
