'use client';

import React, { useRef, useState } from 'react';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Paperclip, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputAreaProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export function InputArea({ onSubmit, isLoading }: InputAreaProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
          className="max-h-48 resize-none border-0 bg-transparent pr-24 shadow-none focus-visible:ring-0"
          rows={1}
          disabled={isLoading}
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          <Button variant="ghost" size="icon" type="button" disabled={isLoading}>
            <Paperclip className="h-5 w-5" />
            <span className="sr-only">Attach file</span>
          </Button>
          <Button type="submit" size="icon" disabled={isLoading || !text.trim()} className="bg-primary hover:bg-primary/90">
            <Send className="h-5 w-5" />
             <span className="sr-only">Generate</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
