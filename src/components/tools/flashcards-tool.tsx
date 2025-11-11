'use client';

import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { ToolOptionsBar } from '../tool-options-bar';
import { InputArea } from '../input-area';
import { generateFlashcardsFromText } from '@/ai/flows/generate-flashcards-from-text';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent } from '../ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../ui/carousel';

interface Flashcard {
  front: string;
  back: string;
  explanation: string;
}

export function FlashcardsTool() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (text: string) => {
    setIsLoading(true);
    setFlashcards([]);
    try {
      const result = await generateFlashcardsFromText({ text });
      setFlashcards(result.cards);
    } catch (error) {
      console.error('Error generating flashcards:', error);
      // You could show a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  const WelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="bg-primary/10 p-4 rounded-full mb-4">
        <Layers className="w-10 h-10 text-primary" />
      </div>
      <h1 className="font-headline text-3xl font-bold mb-2">
        Flashcard Factory
      </h1>
      <p className="text-muted-foreground max-w-md">
        Turn any study material into a set of flashcards. Perfect for quick
        reviews and memorization.
      </p>
    </div>
  );

  const LoadingScreen = () => (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <div className="flex justify-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  );

  const FlashcardView = ({ cards }: { cards: Flashcard[] }) => (
    <div className="flex-grow flex flex-col items-center justify-center p-4 md:p-6">
      <Carousel className="w-full max-w-md">
        <CarouselContent>
          {cards.map((card, index) => (
            <CarouselItem key={index}>
              <div className="p-1">
                <Card className="group aspect-video [perspective:1000px]">
                  <CardContent className="relative h-full w-full rounded-lg shadow-md transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                    <div className="absolute inset-0 flex items-center justify-center bg-card p-6 [backface-visibility:hidden]">
                      <h2 className="text-center font-bold text-2xl">{card.front}</h2>
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-card p-6 [transform:rotateY(180deg)] [backface-visibility:hidden]">
                       <h3 className="text-center text-xl font-semibold">{card.back}</h3>
                       <p className="mt-2 text-center text-sm text-muted-foreground">{card.explanation}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      <ToolOptionsBar
        activeTool="flashcards"
        summaryOptions={{
          detailLevel: 3,
          format: 'paragraphs',
          tone: 'concise',
          animation: true,
        }}
        onSummaryOptionsChange={() => {}}
      />
      <div className="flex-grow overflow-y-auto">
        {isLoading ? (
          <LoadingScreen />
        ) : flashcards.length > 0 ? (
          <FlashcardView cards={flashcards} />
        ) : (
          <WelcomeScreen />
        )}
      </div>
      <InputArea onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
