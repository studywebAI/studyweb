'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ToolOptionsBar, type SummaryOptions } from '../tool-options-bar';
import { InputArea } from '../input-area';
import { handleGenerateSummary } from '@/app/actions';
import { Bot, User, FileText, Printer, Download, Loader2 } from 'lucide-react';
import { cn, downloadFile } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { useApp, type StudySession } from '../app-provider';
import Markdown from 'react-markdown';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';


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
  const { addSession, globalModel, modelOverrides, apiKeys, isSettingsLoaded } = useApp();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleOptionsChange = (newOptions: Partial<SummaryOptions>) => {
    setOptions((prev) => ({ ...prev, ...newOptions }));
  };

  const handleDownload = (content: string) => {
    const title = content.substring(0, 30).replace(/\s/g, '_');
    downloadFile(content, `summary_${title}.md`, 'text/markdown');
  };

  const handleSubmit = async (text: string) => {
    if (!isSettingsLoaded) {
        setError("Settings not loaded yet. Please wait a moment.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setMessages((prev) => [...prev, { role: 'ai', content: '', isStreaming: true }]);
    
    const model = modelOverrides.summary || globalModel;
    const provider = getProviderFromModel(model);
    const apiKey = apiKeys[provider];

     if (!apiKey) {
        setError(`API key for ${provider} is not set. Please add it in Settings.`);
        setMessages(prev => prev.slice(0, -1)); // Remove the streaming placeholder
        setIsLoading(false);
        return;
    }

    try {
      const result = await handleGenerateSummary({ 
          text,
          model,
          apiKey: { provider, key: apiKey }
      });
      let fullText = result.summary;

      addSession({
        title: text.substring(0, 40) + (text.length > 40 ? '...' : ''),
        type: 'summary',
        source_text: text,
        content: result.summary,
      });

      // Deactivate streaming animation for simplicity with multiple providers
      setMessages((prev) =>
          prev.map((msg, index) =>
            index === prev.length - 1
              ? { ...msg, content: fullText, isStreaming: false }
              : msg
          )
        );

    } catch (e: any) {
      console.error('Error generating summary:', e);
       const errorMessage = e.message || 'An unknown error occurred.';
      setMessages(prev => prev.slice(0, -1)); // Remove the streaming placeholder
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
  
  const handleImport = (item: StudySession) => {
      // The summary tool doesn't re-process, it just displays.
      // We will add the imported summary directly to the chat view.
      if (item.source_text) {
          setMessages([
              { role: 'user', content: item.source_text },
              { role: 'ai', content: typeof item.content === 'string' ? item.content : 'Could not display imported content.' }
          ]);
      } else if (typeof item.content === 'string') {
           setMessages([
              { role: 'user', content: item.title }, // Fallback to title if no source_text
              { role: 'ai', content: item.content }
          ]);
      } else {
          setError("Could not import this session. The content is in an unexpected format.")
      }
  }

  const WelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 hide-on-print">
      <div className="bg-primary/10 p-4 rounded-full mb-4">
        <FileText className="w-10 h-10 text-primary" />
      </div>
      <h1 className="font-headline text-3xl font-bold mb-2">Summary Tool</h1>
      <p className="text-muted-foreground max-w-md">
        Paste any text, and I'll generate a concise summary, highlight key points, and provide a TL;DR.
      </p>
    </div>
  );
  
  const SettingsLoadingScreen = () => (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center hide-on-print">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-3xl font-semibold">Loading Settings...</h2>
        <p className="text-muted-foreground text-lg mt-2">Getting your API keys and preferences ready.</p>
    </div>
);
  
  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="hide-on-print">
        <ToolOptionsBar
            activeTool="summary"
            summaryOptions={options}
            onSummaryOptionsChange={handleOptionsChange}
        />
      </div>
      <div className="flex-grow overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {error && (
            <Alert variant="destructive" className="hide-on-print">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!isSettingsLoaded && <SettingsLoadingScreen />}
          {isSettingsLoaded && messages.length === 0 && !isLoading && !error && <WelcomeScreen />}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'flex items-start gap-4 hide-on-print',
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
                  'max-w-[80%] rounded-lg p-4 relative group',
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
                    <>
                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleDownload(msg.content)}
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => window.print()}
                            >
                                <Printer className="h-4 w-4" />
                            </Button>
                        </div>
                        <article className="prose prose-sm max-w-none dark:prose-invert printable-content">
                            <Markdown>{msg.content}</Markdown>
                        </article>
                    </>
                  ) : (
                    <p className="printable-content">{msg.content}</p>
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
      <div className="hide-on-print">
        <InputArea onSubmit={handleSubmit} onImport={handleImport} isLoading={isLoading || !isSettingsLoaded} showImport={true}/>
      </div>
    </div>
  );
}
