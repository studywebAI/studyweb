'use client';

import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { ToolOptionsBar, type FlashcardOptions } from '../tool-options-bar';
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
import { useApp, type RecentItem } from '../app-provider';

interface Flashcard {
  front: string;
  back: string;
  explanation: string;
}

export function FlashcardsTool() {
  const [options, setOptions] = useState<FlashcardOptions>({ cardCount: 20 });
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sourceText, setSourceText] = useState('');
  const { addRecent } = useApp();

  const handleOptionsChange = (newOptions: Partial<FlashcardOptions>) => {
    setOptions((prev) => ({ ...prev, ...newOptions }));
  };

  const generateFlashcards = async (text: string) => {
    setIsLoading(true);
    setFlashcards([]);
    setSourceText(text);
    try {
      const result = await generateFlashcardsFromText({ text });
      setFlashcards(result.cards);
      addRecent({
        title: text.substring(0, 30) + '...',
        type: 'Flashcards',
        content: text,
      });
    } catch (error) {
      console.error('Error generating flashcards:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleImport = (item: RecentItem) => {
    generateFlashcards(item.content);
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
    <div className="flex-grow flex flex-col items-center justify-center p-4 md:p-6">
       <div className="w-full max-w-md p-1">
          <Skeleton className="aspect-video w-full rounded-lg" />
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
        flashcardOptions={options}
        onFlashcardOptionsChange={handleOptionsChange}
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
      <InputArea onSubmit={generateFlashcards} onImport={handleImport} isLoading={isLoading} showImport={true} />
    </div>
  );
}
