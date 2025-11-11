'use client';

import React from 'react';
import { Layers } from 'lucide-react';
import { ToolOptionsBar } from '../tool-options-bar';
import { InputArea } from '../input-area';

export function FlashcardsTool() {
  const WelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="bg-primary/10 p-4 rounded-full mb-4">
        <Layers className="w-10 h-10 text-primary" />
      </div>
      <h1 className="font-headline text-3xl font-bold mb-2">Flashcard Factory</h1>
      <p className="text-muted-foreground max-w-md">
        Turn any study material into a set of flashcards. Perfect for quick reviews and memorization.
      </p>
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-background">
       <ToolOptionsBar
        activeTool="flashcards"
        summaryOptions={{ detailLevel: 3, format: 'paragraphs', tone: 'concise', animation: true }}
        onSummaryOptionsChange={() => {}}
      />
      <div className="flex-grow overflow-y-auto">
         <WelcomeScreen />
      </div>
      <InputArea onSubmit={() => {}} isLoading={false} />
    </div>
  );
}
