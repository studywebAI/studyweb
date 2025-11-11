'use client';

import React, { useRef, useState } from 'react';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Paperclip, Send, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { useApp, RecentItem } from './app-provider';
import { ScrollArea } from './ui/scroll-area';

interface InputAreaProps {
  onSubmit: (text: string) => void;
  onImport?: (item: RecentItem) => void;
  isLoading: boolean;
  showImport: boolean;
}

export function InputArea({
  onSubmit,
  onImport,
  isLoading,
  showImport,
}: InputAreaProps) {
  const [text, setText] = useState('');
  const [isImportOpen, setImportOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { recents } = useApp();

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSubmit(text);
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleImport = (item: RecentItem) => {
    if (onImport) {
      onImport(item);
    }
    setImportOpen(false);
  };

  return (
    <div className="shrink-0 border-t bg-background p-4">
      <form
        onSubmit={handleSubmit}
        className="relative mx-auto max-w-3xl rounded-lg border bg-card p-2 shadow-sm"
      >
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Paste your text, or describe what you want to generate..."
          className="max-h-48 resize-none border-0 bg-transparent pr-36 shadow-none focus-visible:ring-0"
          rows={1}
          disabled={isLoading}
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <Button variant="ghost" size="icon" type="button" disabled={isLoading}>
            <Paperclip className="h-5 w-5" />
            <span className="sr-only">Attach file</span>
          </Button>

          {showImport && onImport && (
            <Dialog open={isImportOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  disabled={isLoading}
                >
                  <FileCode className="h-5 w-5" />
                  <span className="sr-only">Import from Recents</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import from Recents</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-96">
                  <div className="space-y-2 p-1">
                    {recents.length > 0 ? (
                      recents.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleImport(item)}
                          className="w-full text-left rounded-md border p-4 hover:bg-accent"
                        >
                          <p className="font-semibold">{item.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.type} &bull; {item.time}
                          </p>
                        </button>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground">
                        No recent items to import.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          )}

          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !text.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            <Send className="h-5 w-5" />
            <span className="sr-only">Generate</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
