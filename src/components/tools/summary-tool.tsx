'use client';
import React, { useState, useEffect } from 'react';
import { ToolOptionsBar } from '../tool-options-bar';
import { InputArea } from '../input-area';
import { generateSummaryFromText } from '@/ai/flows/generate-summary-from-text';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { Badge } from '../ui/badge';

export interface SummaryOptions {
  detailLevel: number;
  format: 'paragraphs' | 'bullets';
  tone: 'concise' | 'detailed' | 'explanatory';
  animation: boolean;
}

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

  const handleOptionsChange = (newOptions: Partial<SummaryOptions>) => {
    setOptions((prev) => ({ ...prev, ...newOptions }));
  };

  const handleSubmit = async (text: string) => {
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: text }]);

    // Add a placeholder for AI response
    setMessages((prev) => [...prev, { role: 'ai', content: '', isStreaming: true }]);

    // Simulate API call and streaming response
    try {
      const result = await generateSummaryFromText({ text });
      let fullText = result.summary;
      
      const tldr = "TL;DR: " + fullText.split('.').slice(0,1).join('.') + ".";
      const keyPoints = fullText.split('. ').slice(1,4).map(s => s.trim());
      
      const formattedSummary = `
### ${tldr}

**Key Points:**
${keyPoints.map(p => `- ${p}`).join('\n')}

---

### Detailed Summary
${fullText}
      `;


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
              ? { ...msg, content: formattedSummary }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      setMessages((prev) =>
        prev.map((msg, index) =>
          index === prev.length - 1
            ? { ...msg, content: 'Sorry, I had trouble generating a summary.' }
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
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{__html: msg.content.replace(/\n/g, '<br />')}}/>
                )}
              </div>
               {msg.role === 'user' && (
                 <div className="p-2 rounded-full bg-muted text-muted-foreground">
                    <User className="h-5 w-5" />
                 </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <InputArea onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
