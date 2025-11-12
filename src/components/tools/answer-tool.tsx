'use client';
import React, { useState, useEffect, useRef } from 'react';
import { InputArea } from '../input-area';
import { handleGenerateAnswer } from '@/app/actions';
import { Bot, User, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { useApp } from '../app-provider';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface Message {
  role: 'user' | 'ai';
  content: string;
  isStreaming?: boolean;
}

// Helper function to determine the provider from a model name
function getProviderFromModel(model: string): 'openai' | 'google' {
    if (model.startsWith('gemini')) {
      return 'google';
    }
    return 'openai';
}

export function AnswerTool() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { globalModel, modelOverrides, apiKeys } = useApp();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = async (text: string) => {
    setIsLoading(true);
    setError(null);
    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);

    // Add a placeholder for AI response
    setMessages((prev) => [...prev, { role: 'ai', content: '', isStreaming: true }]);

    const model = modelOverrides.answer || globalModel;
    const provider = getProviderFromModel(model);
    const apiKey = apiKeys[provider];

    if (!apiKey) {
        setError(`API key for ${provider} is not set. Please add it in Settings.`);
        setMessages(prev => prev.slice(0, -1)); // Remove placeholder
        setIsLoading(false);
        return;
    }

    try {
      const history = newMessages.filter(m => !m.isStreaming).map(m => ({role: m.role, content: m.content})) as {role: 'user' | 'ai', content: string}[];
      
      const result = await handleGenerateAnswer({ 
          text, 
          history, 
          model,
          apiKey: { provider, key: apiKey }
      });
      
      const fullText = result.answer;

      // Deactivate streaming for now as it's complex with different providers
      setMessages((prev) =>
        prev.map((msg, index) =>
          index === prev.length - 1
            ? { ...msg, content: fullText, isStreaming: false }
            : msg
        )
      );

    } catch (e: any) {
      const errorMessage = e.message || 'An unknown error occurred.';
      console.error('Error generating answer:', e);
      setMessages(prev => prev.slice(0, -1)); // Remove placeholder
      setError(errorMessage);
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
          {error && (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {messages.length === 0 && !isLoading && !error && <WelcomeScreen />}
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