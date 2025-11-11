'use client';
import React from 'react';
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
} from 'lucide-react';
import type { Tool } from './app-provider';
import { useApp } from './app-provider';
import { cn } from '@/lib/utils';


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
  const { recents } = useApp();
  const { state } = useSidebar();
  
  return (
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
            {recents.map((item) => (
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
  );
}
