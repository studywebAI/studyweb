'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ToolOptionsBar, type SummaryOptions } from '../tool-options-bar';
import { InputArea } from '../input-area';
import { handleGenerateSummary } from '@/app/actions';
import { Bot, User, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { useApp } from '../app-provider';
import Markdown from 'react-markdown';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';


interface Message {
  role: 'user' | 'ai';
  content: string;
  isStreaming?: boolean;
}

export function SummaryTool() {
  const [options, setOptions] = useState<SummaryOptions>({
    detailLevel: 3,
    format: 'paragraphs',
    tone: 'concise',
    animation: true,
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addRecent } = useApp();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleOptionsChange = (newOptions: Partial<SummaryOptions>) => {
    setOptions((prev) => ({ ...prev, ...newOptions }));
  };

  const handleSubmit = async (text: string) => {
    setIsLoading(true);
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setMessages((prev) => [...prev, { role: 'ai', content: '', isStreaming: true }]);

    try {
      const result = await handleGenerateSummary({ text });
      let fullText = result.summary;

      const tldr = "TL;DR: " + fullText.split('.').slice(0, 1).join('.') + ".";
      const keyPoints = fullText.split('. ').slice(1, 4).map(s => s.trim()).filter(s => s);
      const detailedSummary = fullText;

      const formattedSummary = `### ${tldr}\n\n**Key Points:**\n${keyPoints.map(p => `- ${p}`).join('\n')}\n\n---\n\n### Detailed Summary\n${detailedSummary}`;

      addRecent({
        title: text.substring(0, 30) + '...',
        type: 'Summary',
        content: fullText,
      });

      if (options.animation) {
        let currentText = '';
        const words = formattedSummary.split(' ');
        for (let i = 0; i < words.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 20));
          currentText += words[i] + ' ';
          setMessages((prev) =>
            prev.map((msg, index) =>
              index === prev.length - 1
                ? { ...msg, content: currentText }
                : msg
            )
          );
        }
      } else {
        setMessages((prev) =>
          prev.map((msg, index) =>
            index === prev.length - 1
              ? { ...msg, content: formattedSummary, isStreaming: false }
              : msg
          )
        );
      }
    } catch (e: any) {
      console.error('Error generating summary:', e);
       const errorMessage = e.message || 'An unknown error occurred.';
      setError(errorMessage);
      setMessages((prev) =>
        prev.map((msg, index) =>
          index === prev.length - 1
            ? { ...msg, content: `Error: ${errorMessage}`, isStreaming: false }
            : msg
        )
      );
    } finally {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.isStreaming ? { ...msg, isStreaming: false } : msg
        )
      );
      setIsLoading(false);
    }
  };

  const WelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="bg-primary/10 p-4 rounded-full mb-4">
        <FileText className="w-10 h-10 text-primary" />
      </div>
      <h1 className="font-headline text-3xl font-bold mb-2">Summary Tool</h1>
      <p className="text-muted-foreground max-w-md">
        Paste any text, and I'll generate a concise summary, highlight key points, and provide a TL;DR.
      </p>
    </div>
  );
  
  return (
    <div className="flex h-screen flex-col bg-background">
      <ToolOptionsBar
        activeTool="summary"
        summaryOptions={options}
        onSummaryOptionsChange={handleOptionsChange}
      />
      <div className="flex-grow overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 && !isLoading && <WelcomeScreen />}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'flex items-start gap-4',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.role === 'ai' && (
                <div className="p-2 rounded-full bg-primary text-primary-foreground">
                  <Bot className="h-5 w-5" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-lg p-4',
                  msg.role === 'user'
                    ? 'bg-primary/10'
                    : 'bg-card border'
                )}
              >
                {msg.isStreaming && msg.content === '' ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-4 w-56" />
                  </div>
                ) : (
                  msg.role === 'ai' ? (
                    <article className="prose prose-sm max-w-none dark:prose-invert">
                      <Markdown>{msg.content}</Markdown>
                    </article>
                  ) : (
                    <p>{msg.content}</p>
                  )
                )}
              </div>
              {msg.role === 'user' && (
                <div className="p-2 rounded-full bg-muted text-muted-foreground">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}
           <div ref={messagesEndRef} />
        </div>
      </div>
      <InputArea onSubmit={handleSubmit} isLoading={isLoading} showImport={false}/>
    </div>
  );
}
