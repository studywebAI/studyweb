'use client';

import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowUp, Plus, History, FileText, BrainCircuit, Layers } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useApp, type StudySession } from './app-provider';


interface InputAreaProps {
  onSubmit: (text: string) => void;
  onImport?: (item: StudySession) => void;
  isLoading: boolean;
  showImport?: boolean;
}

export function InputArea({ onSubmit, onImport, isLoading, showImport = false }: InputAreaProps) {
  const [text, setText] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const { sessions } = useApp();

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleSubmit = () => {
    if (text.trim() && !isLoading) {
      onSubmit(text);
    }
  };

  const handleImportClick = (session: StudySession) => {
    if (onImport) {
      onImport(session);
    }
    setIsPopoverOpen(false); // Close popover after import
  };
  
  const getIconForType = (type: StudySession['type']) => {
    switch (type) {
      case 'summary': return <FileText className="h-5 w-5 text-blue-500" />;
      case 'quiz': return <BrainCircuit className="h-5 w-5 text-green-500" />;
      case 'flashcards': return <Layers className="h-5 w-5 text-purple-500" />;
      default: return <FileText className="h-5 w-5" />;
    }
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto p-4 bg-background">
        <div className="flex items-end rounded-xl border border-input focus-within:shadow-sm">
            {showImport && onImport && (
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="m-2 flex-shrink-0" aria-label="Import content">
                            <Plus className="h-5 w-5" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 mb-2">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium leading-none">Import</h4>
                                <p className="text-sm text-muted-foreground">Import content from a previous session.</p>
                            </div>
                            <div className="space-y-2">
                                <h5 className="font-medium text-sm flex items-center"><History className="mr-2 h-4 w-4"/> Recents</h5>
                                <div className="max-h-60 overflow-y-auto space-y-1">
                                  {sessions.length > 0 ? sessions.map(s => (
                                    <button 
                                        key={s.id} 
                                        className="w-full text-left p-2 hover:bg-accent rounded-md flex items-start gap-3 transition-colors" 
                                        onClick={() => handleImportClick(s)} 
                                    > 
                                        {getIconForType(s.type)}
                                        <div className="flex-grow">
                                            <p className="font-medium text-sm leading-tight">{s.title}</p>
                                            <p className="text-xs text-muted-foreground">{s.type}</p>
                                        </div>
                                    </button>
                                  )) : <p className='text-sm text-muted-foreground text-center p-4'>No recent sessions.</p>}
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            )}
            <Textarea
            value={text}
            onChange={handleTextChange}
            placeholder="Enter your text or notes here..."
            className="flex-1 bg-transparent border-0 resize-none shadow-none focus-visible:ring-0 text-base py-4 px-2"
            rows={1}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                    e.preventDefault();
                    handleSubmit();
                }
            }}
            />
            <Button 
                onClick={handleSubmit} 
                disabled={isLoading || !text.trim()} 
                className="m-2 flex-shrink-0 h-10 w-10"
                size="icon"
                aria-label="Submit"
                >
                <ArrowUp className="h-5 w-5" />
            </Button>
      </div>
    </div>
  );
}
