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
  
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bot className="h-5 w-5 text-primary" />
          </Button>
          <div className="flex flex-col">
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
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
