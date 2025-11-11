'use client';
import React, { useState, useEffect, useRef } from 'react';
import { InputArea } from '../input-area';
import { generateAnswerFromText } from '@/ai/flows/generate-answer-from-text';
import { Bot, User, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';

interface Message {
  role: 'user' | 'ai';
  content: string;
  isStreaming?: boolean;
}

export function AnswerTool() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = async (text: string) => {
    setIsLoading(true);
    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);

    // Add a placeholder for AI response
    setMessages((prev) => [...prev, { role: 'ai', content: '', isStreaming: true }]);

    try {
      const history = newMessages.filter(m => !m.isStreaming);
      const result = await generateAnswerFromText({ text, history });
      const fullText = result.answer;

      let currentText = '';
      const words = fullText.split(' ');
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

    } catch (error) {
      console.error('Error generating answer:', error);
      setMessages((prev) =>
        prev.map((msg, index) =>
          index === prev.length - 1
            ? { ...msg, content: 'Sorry, I had trouble generating an answer.' }
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
        <HelpCircle className="w-10 h-10 text-primary" />
      </div>
      <h1 className="font-headline text-3xl font-bold mb-2">Answer Tool</h1>
      <p className="text-muted-foreground max-w-md">
        Ask me anything! I'll do my best to provide a clear and concise answer.
      </p>
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-background">
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
                  <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />') }} />
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
      <InputArea onSubmit={handleSubmit} isLoading={isLoading} showImport={false} />
    </div>
  );
}
