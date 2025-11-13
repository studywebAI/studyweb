'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Layers, Check, X, RotateCw, BarChart, ArrowRight, Timer, Eye, BrainCircuit, HelpCircle, Bot, Loader2, Printer, Download } from 'lucide-react';
import { ToolOptionsBar, type FlashcardOptions } from '../tool-options-bar';
import { InputArea } from '../input-area';
import { handleGenerateFlashcards, handleGenerateAnswer, handleGenerateHint } from '@/app/actions';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useApp, type StudySession } from '../app-provider';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { cn, downloadFile } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';


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

function getProviderFromModel(model: string): 'openai' | 'google' {
    if (model.startsWith('gemini')) return 'google';
    return 'openai';
}

const FollowUpQandA = ({ card }: { card: Flashcard }) => {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [isAsking, setIsAsking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { globalModel, modelOverrides, apiKeys } = useApp();

    const handleAsk = async () => {
        if (!question.trim()) return;

        setIsAsking(true);
        setError(null);
        setAnswer('');

        const model = modelOverrides.answer || globalModel;
        const provider = getProviderFromModel(model);
        const apiKey = apiKeys[provider];

        if (!apiKey) {
            setError(`API key for ${provider} is not set. Please add it in Settings.`);
            setIsAsking(false);
            return;
        }
        
        const context = `I am studying a flashcard:\nFront: "${card.front}"\nBack: "${card.back}"\nExplanation: "${card.explanation}"\n\nBased on this, answer my follow-up question.`;

        try {
            const result = await handleGenerateAnswer({ text: question, history: [{ role: 'user', content: context }], model, apiKey: { provider, key: apiKey } });
            setAnswer(result.answer);
        } catch (e: any) {
            setError(e.message || "An error occurred.");
        } finally {
            setIsAsking(false);
        }
    }

    return (
        <div className="space-y-2 pt-4">
            <Label htmlFor="follow-up-q" className="text-base">Have a follow-up question?</Label>
            <Textarea 
                id="follow-up-q" 
                placeholder="Ask about this concept..." 
                className="min-h-[60px] text-base" 
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={isAsking}
            />
            <Button size="sm" className="w-full" onClick={handleAsk} disabled={isAsking || !question.trim()}>
                {isAsking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ask AI
            </Button>
            {error && <p className="text-xs text-destructive">{error}</p>}
            {answer && (
                <div className="text-sm p-3 rounded-md bg-muted/50 border flex gap-2">
                    <Bot className="h-4 w-4 mt-1 flex-shrink-0" />
                    <p>{answer}</p>
                </div>
            )}
        </div>
    )
}


export function FlashcardsTool() {
  const [options, setOptions] = useState<FlashcardOptions>({ cardCount: 20 });
  const [sourceText, setSourceText] = useState('');
  
  const [allCards, setAllCards] = useState<SessionCard[]>([]);
  const [sessionCards, setSessionCards] = useState<SessionCard[]>([]);
  const [originalSessionResults, setOriginalSessionResults] = useState<SessionCard[] | null>(null);
  const [retryHistory, setRetryHistory] = useState<SessionCard[][]>([]);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hint, setHint] = useState<string | null>(null);
  const [isAskingHint, setIsAskingHint] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);
  
  const cardStartTime = useRef(Date.now());
  const { addSession, globalModel, modelOverrides, apiKeys, isSettingsLoaded } = useApp();

  useEffect(() => {
    cardStartTime.current = Date.now();
    setIsFlipped(false);
    setHint(null);
    setHintError(null);
  }, [currentCardIndex, sessionCards]);

  const handleOptionsChange = (newOptions: Partial<FlashcardOptions>) => {
    setOptions((prev) => ({ ...prev, ...newOptions }));
  };
  
  const startNewSession = (cardsToPractice: Flashcard[], isRetry = false) => {
    const newSessionCards = cardsToPractice.map(card => ({...card, isCorrect: null, timeSpent: 0, flips: 0}));
    setAllCards(newSessionCards);
    
    if (isRetry) {
        setSessionCards(newSessionCards);
    } else {
        setOriginalSessionResults(null);
        setRetryHistory([]);
        setSessionCards(newSessionCards);
    }
    
    setCurrentCardIndex(0);
    setShowResults(false);
    setIsFlipped(false);
    setHint(null);
  };

  const generateFlashcards = async (text: string) => {
    if (!isSettingsLoaded) {
        setError("Settings not loaded yet. Please wait a moment.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setSourceText(text);

    const model = modelOverrides.flashcards || globalModel;
    const provider = getProviderFromModel(model);
    const apiKey = apiKeys[provider];

    if (!apiKey) {
        setError(`API key for ${provider} is not set. Please add it in Settings.`);
        setIsLoading(false);
        return;
    }

    try {
      const result = await handleGenerateFlashcards({ text, model, apiKey: { provider, key: apiKey }, options });
      startNewSession(result.cards);
      addSession({ 
          title: `Flashcards on: ${text.substring(0, 30)}...`, 
          type: 'flashcards', 
          source_text: text,
          content: result
      });
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleImport = (item: StudySession) => {
    if (item.source_text) {
        generateFlashcards(item.source_text);
    } else {
        // Fallback for older sessions
        console.warn('Importing session without source_text, using fallback.');
        if (item.type === 'flashcards' && item.content.cards) {
            startNewSession(item.content.cards);
        } else if (typeof item.content === 'string') {
            generateFlashcards(item.content);
        } else {
            setError("Could not import this session. The content is in an unexpected format or empty.");
        }
    }
  };
  
  const handleFlip = () => {
    if (!isFlipped) {
        setSessionCards(prev => {
            const newCards = [...prev];
            newCards[currentCardIndex].flips += 1;
            return newCards;
        });
    }
    setIsFlipped(!isFlipped);
  }

  const handleMarkAnswer = (isCorrect: boolean) => {
    const timeSpent = (Date.now() - cardStartTime.current) / 1000;
    setSessionCards(prevCards => {
        const newCards = [...prevCards];
        newCards[currentCardIndex].isCorrect = isCorrect;
        newCards[currentCardIndex].timeSpent += timeSpent;
        return newCards;
    });

    if (currentCardIndex < sessionCards.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
    } else {
        if (originalSessionResults) { 
            setRetryHistory(prev => [...prev, sessionCards]);
            setAllCards(originalSessionResults); // Restore the full set for the results screen
            setSessionCards(originalSessionResults); // Show results for the original full set
            setOriginalSessionResults(null);
        }
        setShowResults(true);
    }
  };
  
  const handleAskForHint = async () => {
    const card = sessionCards[currentCardIndex];
    if (!card) return;

    setIsAskingHint(true);
    setHintError(null);
    setHint(null);

    const model = modelOverrides.answer || globalModel;
    const provider = getProviderFromModel(model);
    const apiKey = apiKeys[provider];

    if (!apiKey) {
        setHintError(`API key for ${provider} is not set.`);
        setIsAskingHint(false);
        return;
    }

    try {
        const result = await handleGenerateHint({ card, model, apiKey: { provider, key: apiKey } });
        setHint(result.hint);
    } catch (e: any) {
        setHintError(e.message || "Failed to get hint.");
    } finally {
        setIsAskingHint(false);
    }
  };

  const handleStartRetry = (cardsToRetry: SessionCard[]) => {
    if (sessionCards.length > 0 && !originalSessionResults) {
        setOriginalSessionResults([...sessionCards]);
    }
    startNewSession(cardsToRetry, true);
  }

  const handleRetryIncorrect = () => {
    const incorrectCards = (originalSessionResults || sessionCards).filter(card => card.isCorrect === false);
    if (incorrectCards.length > 0) {
        handleStartRetry(incorrectCards);
    }
  };

  const handleRetryStruggled = () => {
    const struggledCards = (originalSessionResults || sessionCards).filter(card => card.timeSpent > 5);
     if (struggledCards.length > 0) {
        handleStartRetry(struggledCards);
    }
  };
  
  const handleReviewAll = () => {
      if(originalSessionResults) {
          startNewSession(originalSessionResults);
      } else {
          startNewSession(allCards);
      }
  }

  const renderContent = () => {
    if (!isSettingsLoaded) return <SettingsLoadingScreen />;
    if (isLoading) return <LoadingScreen />;
    if (error) return <ErrorDisplay message={error} />;
    if (showResults) return <ResultsScreen allCards={originalSessionResults || allCards} sessionCards={sessionCards} retryHistory={retryHistory} onReviewAll={handleReviewAll} onRetryIncorrect={handleRetryIncorrect} onRetryStruggled={handleRetryStruggled} />;
    if (sessionCards.length > 0 && sessionCards[currentCardIndex]) return <FlashcardView key={currentCardIndex} card={sessionCards[currentCardIndex]} isFlipped={isFlipped} onFlip={handleFlip} onMarkAnswer={handleMarkAnswer} onAskForHint={handleAskForHint} isAskingHint={isAskingHint} hint={hint} hintError={hintError} sessionCards={sessionCards} currentCardIndex={currentCardIndex} />;
    return <WelcomeScreen />;
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <ToolOptionsBar activeTool="flashcards" flashcardOptions={options} onFlashcardOptionsChange={handleOptionsChange} />
      <div className="flex-grow overflow-y-auto">{renderContent()}</div>
      <div className="hide-on-print"><InputArea onSubmit={generateFlashcards} onImport={handleImport} isLoading={isLoading || !isSettingsLoaded} showImport={true} /></div>
    </div>
  );
}

// --- Child Components ---

const WelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 hide-on-print">
      <div className="bg-primary/10 p-4 rounded-full mb-4"><Layers className="w-10 h-10 text-primary" /></div>
      <h1 className="font-headline text-3xl font-bold mb-2">Flashcard Factory</h1>
      <p className="text-muted-foreground max-w-md">Turn any study material into a set of flashcards. Perfect for quick reviews and memorization.</p>
    </div>
  );

const SettingsLoadingScreen = () => (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center hide-on-print">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-3xl font-semibold">Loading Settings...</h2>
        <p className="text-muted-foreground text-lg mt-2">Getting your API keys and preferences ready.</p>
    </div>
);

const LoadingScreen = () => (
    <div className="flex-grow flex flex-col items-center justify-center p-4 md:p-6 hide-on-print">
       <div className="w-full max-w-2xl p-1"><Skeleton className="aspect-video w-full rounded-lg" /></div>
    </div>
  );

const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center h-full p-8"><Alert variant="destructive" className="max-w-lg"><AlertTitle>Generation Failed</AlertTitle><AlertDescription>{message}</AlertDescription></Alert></div>
);

const FlashcardView = ({ card, isFlipped, onFlip, onMarkAnswer, onAskForHint, isAskingHint, hint, hintError, sessionCards, currentCardIndex }) => (
    <div className="flex-grow flex flex-col items-center justify-center p-4 md:p-6 hide-on-print">
       <div className="w-full max-w-2xl mb-4">
        <p className="text-center text-muted-foreground">Card {currentCardIndex + 1} of {sessionCards.length}</p>
        <div className="w-full bg-muted rounded-full h-2.5 mt-2"><div className="bg-primary h-2.5 rounded-full" style={{ width: `${((currentCardIndex + 1) / sessionCards.length) * 100}%` }}></div></div>
      </div>
      <Card className="w-full max-w-2xl aspect-video [perspective:1000px]">
        <div className={cn("relative h-full w-full rounded-lg shadow-lg transition-transform duration-500 [transform-style:preserve-3d]", isFlipped && "[transform:rotateY(180deg)]")}>
          <div className="absolute inset-0 flex items-center justify-center bg-card p-6 [backface-visibility:hidden]"><h2 className="text-center font-bold text-4xl">{card.front}</h2></div>
          <div className="absolute inset-0 flex flex-col bg-card p-6 [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-y-auto">
             <Collapsible className="w-full h-full flex flex-col">
                <div className="flex-grow flex items-center justify-center"><h3 className="text-center text-3xl font-semibold">{card.back}</h3></div>
                <CollapsibleContent className="p-4 border-t text-sm bg-background rounded-b-lg overflow-y-auto">
                  <p className="font-semibold mb-2 text-base">Explanation</p>
                  <p className="text-muted-foreground mb-4 text-base">{card.explanation}</p>
                  <FollowUpQandA card={card} />
                </CollapsibleContent>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8"><HelpCircle className="h-5 w-5" /></Button>
                </CollapsibleTrigger>
             </Collapsible>
          </div>
        </div>
      </Card>
      <div className="w-full max-w-2xl mt-6 flex justify-center items-center gap-4">
        {isFlipped ? (
            <>
                <Button variant="outline" size="lg" className="text-lg p-6 bg-red-500/10 border-red-500 text-red-600 hover:bg-red-500/20" onClick={() => onMarkAnswer(false)}><X className="mr-2" /> I didn't know it</Button>
                <Button variant="outline" size="lg" className="text-lg p-6 bg-green-500/10 border-green-500 text-green-600 hover:bg-green-500/20" onClick={() => onMarkAnswer(true)}><Check className="mr-2" /> I knew it</Button>
            </>
        ) : (
            <Button size="lg" className="text-lg p-6" onClick={onFlip}><RotateCw className="mr-2"/>Flip Card</Button>
        )}
      </div>
       <div className="w-full max-w-2xl mt-4 space-y-2">
            <Button variant="outline" size="sm" className="w-full" onClick={onAskForHint} disabled={isAskingHint || hint !== null}>
                {isAskingHint && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {hint ? 'Hint Received' : 'Ask AI for Hint'}
            </Button>
            {hintError && <p className="text-xs text-destructive text-center">{hintError}</p>}
            {hint && <div className="text-sm p-3 rounded-md bg-muted/50 border flex gap-2"><Bot className="h-4 w-4 mt-1 flex-shrink-0" /><p>{hint}</p></div>}
        </div>
    </div>
  );
  
const ResultsScreen = ({ allCards, sessionCards, retryHistory, onReviewAll, onRetryIncorrect, onRetryStruggled }) => {
    const incorrectCount = sessionCards.filter(c => c.isCorrect === false).length;
    const struggledCount = sessionCards.filter(card => card.timeSpent > 5).length;
    const correctCount = sessionCards.filter(c => c.isCorrect).length;
    const accuracy = sessionCards.length > 0 ? (correctCount / sessionCards.length) * 100 : 0;
    const totalTime = sessionCards.reduce((acc, card) => acc + card.timeSpent, 0);
    const avgTime = sessionCards.length > 0 ? totalTime / sessionCards.length : 0;

    return (
        <div className="flex-grow flex flex-col items-center p-4 md:p-6 text-center">
            <Card className="w-full max-w-4xl printable-content">
                <CardHeader><CardTitle className="flex items-center justify-center"><BarChart className="w-10 h-10 text-primary mr-4" /><h1 className="font-headline text-5xl font-bold">Session Complete!</h1></CardTitle></CardHeader>
                <CardContent className="space-y-8 p-8">
                    <div className="grid grid-cols-2 gap-6 text-center">
                        <div className="rounded-lg bg-primary/10 p-6"><p className="text-lg font-medium text-muted-foreground">Accuracy</p><p className="text-5xl font-bold">{accuracy.toFixed(0)}%</p><p className="text-md text-muted-foreground">({correctCount}/{sessionCards.length} correct)</p></div>
                        <div className="rounded-lg bg-primary/10 p-6"><p className="text-lg font-medium text-muted-foreground">Avg. Time</p><p className="text-5xl font-bold">{avgTime.toFixed(1)}s</p><p className="text-md text-muted-foreground">per card</p></div>
                    </div>
                    {retryHistory.length > 0 && (
                        <div>
                            <Separator />
                            <h3 className="text-2xl font-bold mt-6 mb-4">Retried Flashcards</h3>
                            {retryHistory.map((retrySession, index) => {
                                const retryCorrect = retrySession.filter(c => c.isCorrect).length;
                                const retryTotal = retrySession.length;
                                const retryAccuracy = retryTotal > 0 ? (retryCorrect / retryTotal) * 100 : 0;
                                return (<div key={index} className="rounded-lg border p-4 mb-2 text-left"><p className="font-semibold">Retry Attempt {index + 1}: &nbsp; <span className="font-normal">{retryCorrect} / {retryTotal} correct ({retryAccuracy.toFixed(0)}%)</span></p></div>)
                            })}
                        </div>
                    )}
                    <Separator />
                    <Accordion type="single" collapsible className="w-full text-left">
                        <AccordionItem value="item-1"><AccordionTrigger className="text-xl">Review All Cards ({allCards.length})</AccordionTrigger><AccordionContent><div className="space-y-4 p-2 max-h-72 overflow-y-auto">{allCards.map((card, index) => (<div key={index} className="p-4 border rounded-md"><p className="font-semibold text-lg">{card.front}</p><p className="text-muted-foreground">{card.back}</p></div>))}</div></AccordionContent></AccordionItem>
                    </Accordion>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 hide-on-print pt-4">
                        <Button size="lg" onClick={onReviewAll}>Review All Again <ArrowRight className="ml-2" /></Button>
                        <Button size="lg" variant="outline" onClick={onRetryIncorrect} disabled={incorrectCount === 0}>Retry {incorrectCount} Incorrect <X className="ml-2" /></Button>
                        <Button size="lg" variant="outline" onClick={onRetryStruggled} disabled={struggledCount === 0}>Retry {struggledCount} Struggled <BrainCircuit className="ml-2" /></Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
