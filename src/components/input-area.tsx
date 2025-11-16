'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, Paperclip, Loader2, Import } from 'lucide-react';
import { useApp, type StudySession } from './app-provider';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';

interface InputAreaProps {
  onSubmit: (text: string) => void;
  onImport?: (item: StudySession) => void; 
  isLoading: boolean;
  showImport?: boolean;
}

export function InputArea({ onSubmit, onImport, isLoading, showImport = false }: InputAreaProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sessions, isSessionsLoading } = useApp();
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    adjustTextareaHeight();
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleImportClick = (session: StudySession) => {
    if (onImport) {
      onImport(session);
      setPopoverOpen(false);
    }
  }

  useEffect(() => {
    adjustTextareaHeight();
  }, [text]);

  return (
    <div className="relative p-4 border-t bg-background shadow-top">
      <form onSubmit={handleSubmit} className="relative flex items-end w-full">
        {showImport && onImport && (
             <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="mr-2 flex-shrink-0" disabled={isLoading}>
                        <Import className="h-5 w-5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-80" align="start">
                    <Command>
                        <CommandInput placeholder="Search sessions..." />
                        <CommandList>
                            <CommandEmpty>
                                {isSessionsLoading ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
                                ) : (
                                    <div className="p-4 text-center text-sm text-muted-foreground">No recent sessions found.</div>
                                )}
                            </CommandEmpty>
                            <CommandGroup heading="Recent Sessions">
                                {sessions && sessions.map((session) => (
                                    <CommandItem 
                                        key={session.id} 
                                        onSelect={() => handleImportClick(session)}
                                        className="cursor-pointer"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">{session.title}</span>
                                            <span className="text-xs text-muted-foreground">{session.type} - {new Date(session.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        )}
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Or, just start typing your text here to generate a study set..."
          className="flex-grow resize-none overflow-y-hidden transition-height duration-200 ease-in-out pr-24 pl-4 py-3 leading-tight"
          rows={1}
          disabled={isLoading}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <Button type="submit" size="icon" disabled={isLoading || !text.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
