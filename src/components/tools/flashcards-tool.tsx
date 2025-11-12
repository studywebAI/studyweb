'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Layers, Check, X, RotateCw, BarChart, ArrowRight, Timer, Eye } from 'lucide-react';
import { ToolOptionsBar, type FlashcardOptions } from '../tool-options-bar';
import { InputArea } from '../input-area';
import { handleGenerateFlashcards } from '@/app/actions';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useApp, type RecentItem } from '../app-provider';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';

interface Flashcard {
  front: string;
  back: string;
  explanation: string;
}

interface SessionCard extends Flashcard {
    isCorrect: boolean | null;
    timeSpent: number;
    flips: number;
}

// Helper function to determine the provider from a model name
function getProviderFromModel(model: string): 'openai' | 'google' {
    if (model.startsWith('gemini')) {
      return 'google';
    }
    return 'openai';
}

export function FlashcardsTool() {
  const [options, setOptions] = useState<FlashcardOptions>({ cardCount: 20 });
  const [sessionCards, setSessionCards] = useState<SessionCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceText, setSourceText] = useState('');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const cardStartTime = useRef(Date.now());
  const { addRecent, globalModel, modelOverrides, apiKeys } = useApp();

  useEffect(() => {
    // Reset timer when card changes or when starting a new session
    cardStartTime.current = Date.now();
    setIsFlipped(false);
  }, [currentCardIndex, showResults]);


  const handleOptionsChange = (newOptions: Partial<FlashcardOptions>) => {
    setOptions((prev) => ({ ...prev, ...newOptions }));
  };

  const generateFlashcards = async (text: string) => {
    setIsLoading(true);
    setSessionCards([]);
    setError(null);
    setSourceText(text);
    setCurrentCardIndex(0);
    setShowResults(false);
    setIsFlipped(false);

    const model = modelOverrides.flashcards || globalModel;
    const provider = getProviderFromModel(model);
    const apiKey = apiKeys[provider];

    if (!apiKey) {
        setError(`API key for ${provider} is not set. Please add it in Settings.`);
        setIsLoading(false);
        return;
    }

    try {
      const result = await handleGenerateFlashcards({ 
          text, 
          model,
          apiKey: { provider, key: apiKey }
      });
      const newSessionCards = result.cards.map(card => ({
          ...card,
          isCorrect: null,
          timeSpent: 0,
          flips: 0
      }));
      setSessionCards(newSessionCards);
      addRecent({
        title: text.substring(0, 30) + '...',
        type: 'Flashcards',
        content: text,
      });
    } catch (e: any) {
      const errorMessage = e.message || 'An unknown error occurred.';
      console.error('Error generating flashcards:', e);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleImport = (item: RecentItem) => {
    generateFlashcards(item.content);
  };
  
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (!isFlipped) { // Only count flips to the back
        const newCards = [...sessionCards];
        if (newCards[currentCardIndex]) {
            newCards[currentCardIndex].flips += 1;
            setSessionCards(newCards);
        }
    }
  }

  const handleMarkAnswer = (isCorrect: boolean) => {
    const timeSpent = (Date.now() - cardStartTime.current) / 1000;
    const newCards = [...sessionCards];
    if (newCards[currentCardIndex]) {
        newCards[currentCardIndex].isCorrect = isCorrect;
        newCards[currentCardIndex].timeSpent += timeSpent;
        setSessionCards(newCards);
    }

    if (currentCardIndex < sessionCards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
    } else {
        // Last card, show results
        setShowResults(true);
    }
  };

  const handleReviewAgain = () => {
    setCurrentCardIndex(0);
    setShowResults(false);
    setIsFlipped(false);
    // Reset session stats
    const resetCards = sessionCards.map(card => ({
        ...card,
        isCorrect: null,
        timeSpent: 0,
        flips: 0
    }));
    setSessionCards(resetCards);
  };

  const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <Alert variant="destructive" className="max-w-lg">
        <AlertTitle>Generation Failed</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </div>
  );

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

  const FlashcardView = ({ card, isFlipped }: { card: SessionCard, isFlipped: boolean }) => (
    <div className="flex-grow flex flex-col items-center justify-center p-4 md:p-6">
       <div className="w-full max-w-md mb-4">
        <p className="text-center text-muted-foreground">Card {currentCardIndex + 1} of {sessionCards.length}</p>
        <div className="w-full bg-muted rounded-full h-2.5 mt-2">
            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${((currentCardIndex + 1) / sessionCards.length) * 100}%` }}></div>
        </div>
      </div>
      <Card className="w-full max-w-md aspect-video [perspective:1000px]">
        <button
          onClick={handleFlip}
          className={cn(
            "relative h-full w-full rounded-lg shadow-md transition-transform duration-500 [transform-style:preserve-3d]",
            isFlipped && "[transform:rotateY(180deg)]",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          )}
        >
          <CardContent className="absolute inset-0 flex items-center justify-center bg-card p-6 [backface-visibility:hidden]">
            <h2 className="text-center font-bold text-2xl">{card.front}</h2>
          </CardContent>
          <CardContent className="absolute inset-0 flex flex-col items-center justify-center bg-card p-6 [transform:rotateY(180deg)] [backface-visibility:hidden]">
            <h3 className="text-center text-xl font-semibold">{card.back}</h3>
          </CardContent>
        </button>
      </Card>
      <div className="w-full max-w-md mt-6 flex justify-center items-center gap-4">
        {isFlipped ? (
            <>
                <Button variant="outline" size="lg" className="bg-red-500/10 border-red-500 text-red-600 hover:bg-red-500/20" onClick={() => handleMarkAnswer(false)}>
                    <X className="mr-2" /> I didn't know it
                </Button>
                <Button variant="outline" size="lg" className="bg-green-500/10 border-green-500 text-green-600 hover:bg-green-500/20" onClick={() => handleMarkAnswer(true)}>
                    <Check className="mr-2" /> I knew it
                </Button>
            </>
        ) : (
            <Button size="lg" onClick={handleFlip}>
                <RotateCw className="mr-2"/>
                Flip Card
            </Button>
        )}
      </div>
    </div>
  );
  
  const ResultsScreen = () => {
    const correctCount = sessionCards.filter(c => c.isCorrect).length;
    const accuracy = sessionCards.length > 0 ? (correctCount / sessionCards.length) * 100 : 0;
    
    const totalTime = sessionCards.reduce((acc, card) => acc + card.timeSpent, 0);
    const avgTime = sessionCards.length > 0 ? totalTime / sessionCards.length : 0;

    const longestCard = sessionCards.length > 0 ? sessionCards.reduce((max, card) => card.timeSpent > max.timeSpent ? card : max) : null;
    const mostFlippedCard = sessionCards.length > 0 ? sessionCards.reduce((max, card) => card.flips > max.flips ? card : max) : null;


    return (
        <div className="flex-grow flex flex-col items-center justify-center p-4 md:p-6 text-center">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center justify-center">
                        <BarChart className="w-8 h-8 text-primary mr-4" />
                        <h1 className="font-headline text-4xl font-bold">Session Complete!</h1>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="rounded-lg bg-primary/10 p-4">
                            <p className="text-sm font-medium text-muted-foreground">Accuracy</p>
                            <p className="text-3xl font-bold">{accuracy.toFixed(0)}%</p>
                            <p className="text-xs text-muted-foreground">({correctCount}/{sessionCards.length} correct)</p>
                        </div>
                        <div className="rounded-lg bg-primary/10 p-4">
                            <p className="text-sm font-medium text-muted-foreground">Avg. Time</p>
                            <p className="text-3xl font-bold">{avgTime.toFixed(1)}s</p>
                             <p className="text-xs text-muted-foreground">per card</p>
                        </div>
                    </div>
                    
                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        {longestCard && (
                             <div className="rounded-lg border p-4">
                                <h3 className="font-semibold flex items-center mb-2"><Timer className="mr-2 h-4 w-4"/>Longest Card</h3>
                                <p className="text-sm font-medium truncate">"{longestCard.front}"</p>
                                <p className="text-xs text-muted-foreground">{longestCard.timeSpent.toFixed(1)} seconds</p>
                            </div>
                        )}
                        {mostFlippedCard && mostFlippedCard.flips > 0 && (
                            <div className="rounded-lg border p-4">
                                <h3 className="font-semibold flex items-center mb-2"><Eye className="mr-2 h-4 w-4"/>Most Flipped Card</h3>
                                <p className="text-sm font-medium truncate">"{mostFlippedCard.front}"</p>
                                <p className="text-xs text-muted-foreground">{mostFlippedCard.flips} flips</p>
                            </div>
                        )}
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-center gap-4">
                        <Button onClick={handleReviewAgain}>
                            Review Again <ArrowRight className="ml-2" />
                        </Button>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
  }


  const renderContent = () => {
    if (isLoading) {
      return <LoadingScreen />;
    }
    if (error) {
      return <ErrorDisplay message={error} />;
    }
    if (showResults) {
        return <ResultsScreen />;
    }
    if (sessionCards.length > 0 && sessionCards[currentCardIndex]) {
      return <FlashcardView card={sessionCards[currentCardIndex]} isFlipped={isFlipped} />;
    }
    return <WelcomeScreen />;
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <ToolOptionsBar
        activeTool="flashcards"
        flashcardOptions={options}
        onFlashcardOptionsChange={handleOptionsChange}
      />
      <div className="flex-grow overflow-y-auto">
        {renderContent()}
      </div>
      <InputArea onSubmit={generateFlashcards} onImport={handleImport} isLoading={isLoading} showImport={true} />
    </div>
  );
}
