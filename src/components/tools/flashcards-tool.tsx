'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ToolOptionsBar, type FlashcardOptions } from '../tool-options-bar';
import { InputArea } from '../input-area';
import { handleGenerateFlashcards, handleGetHint } from '@/app/actions';
import { Loader2, AlertCircle, Sparkles, Wand, ArrowRight, ArrowLeft, RefreshCw, Trophy, BookOpen, Repeat, Star, HelpCircle, ChevronsRight, Send } from 'lucide-react';
import { useApp, type StudySession } from '../app-provider';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '../ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';
import Markdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface Flashcard {
  front: string;
  back: string;
  explanation?: string;
}

interface SessionCard extends Flashcard {
    isCorrect: boolean | null;
    timeSpent: number;
    flips: number;
}

interface Question {
  question: string;
  correctAnswer: string;
  explanation: string;
}


export function FlashcardsTool() {
  const [options, setOptions] = useState<FlashcardOptions>({ difficulty: 'medium' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allCards, setAllCards] = useState<SessionCard[]>([]);
  const [sessionCards, setSessionCards] = useState<SessionCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [originalSessionResults, setOriginalSessionResults] = useState<SessionCard[] | null>(null);
  const [retryHistory, setRetryHistory] = useState<SessionCard[][]>([]);
  const { addSession, globalModel, modelOverrides, apiKeys, isSettingsLoaded } = useApp();
  
  const getProviderFromModel = (model: string) => model.startsWith('gemini') ? 'google' : 'openai';

  const generateFlashcards = async (text: string) => {
    if (!isSettingsLoaded) return;
    setIsLoading(true);
    setError(null);
    setAllCards([]);
    setSessionCards([]);
    setShowResults(false);
    
    const model = modelOverrides.flashcards || globalModel;
    const provider = getProviderFromModel(model);
    const apiKey = apiKeys[provider];
    if (!apiKey) {
        setError(`API key for ${provider} is not set.`);
        setIsLoading(false);
        return;
    }

    try {
      const result = await handleGenerateFlashcards({ text, model, apiKey: { provider, key: apiKey }});
      startNewSession(result.cards);
      addSession({ title: `Flashcards on: ${text.substring(0, 30)}...`, type: 'flashcards', content: result, source_text: text });
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const startNewSession = (cardsToPractice: Flashcard[], isRetry = false) => {
    if (!isRetry) {
        setOriginalSessionResults(null);
        setRetryHistory([]);
    }
    const resetCards = cardsToPractice.map(card => ({...card, isCorrect: null, timeSpent: 0, flips: 0}));
    setAllCards(resetCards);
    setSessionCards(resetCards);
    setCurrentCardIndex(0);
    setShowResults(false);
  };

  const handleImport = (item: StudySession) => {
    let importText = '';
    if (item.source_text) {
        importText = item.source_text;
    } else if (typeof item.content === 'string') {
        importText = item.content;
    } else if (item.type === 'flashcards' && item.content && 'cards' in item.content) {
        const flashcardContent = item.content as { cards: Flashcard[] };
        if (flashcardContent.cards) {
            startNewSession(flashcardContent.cards);
            setError(null);
            return;
        }
    } else if (item.type === 'quiz' && item.content && 'questions' in item.content) {
        const quizContent = item.content as { questions: Question[] };
        if (quizContent.questions) {
             importText = "Generate flashcards based on the following quiz material:\n\n" + quizContent.questions
                .map(q => `Question: \"${q.question}\"\nAnswer: \"${q.correctAnswer}\"`)
                .join('\n\n---\n\n');
        }
    } else {
        setError("Could not import this session. The content is in an unexpected format or empty.");
        return;
    }

    if (importText) {
        generateFlashcards(importText);
    }
  };

  const handleStartRetry = (cardsToRetry: SessionCard[]) => {
    if (sessionCards.length > 0 && !originalSessionResults) {
        setOriginalSessionResults([...sessionCards]);
    }
    startNewSession(cardsToRetry, true);
  }

  const handleRetryIncorrect = () => {
    const incorrectCards = sessionCards.filter(card => card.isCorrect === false);
    if (incorrectCards.length > 0) {
        handleStartRetry(incorrectCards);
    }
  };

  const handleRetryStruggled = () => {
    const struggledCards = sessionCards.filter(card => card.timeSpent > 5);
     if (struggledCards.length > 0) {
        handleStartRetry(struggledCards);
    }
  };

  const renderContent = () => {
    if (!isSettingsLoaded) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (isLoading && sessionCards.length === 0) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    if (showResults) return <ResultsScreen sessionCards={sessionCards} onReviewAll={() => { setShowResults(false); setCurrentCardIndex(0); }} onRetryIncorrect={handleRetryIncorrect} onRetryStruggled={handleRetryStruggled} allCards={allCards} originalSessionResults={originalSessionResults} />;    if (sessionCards.length > 0) return <FlashcardSession sessionCards={sessionCards} setSessionCards={setSessionCards} currentCardIndex={currentCardIndex} setCurrentCardIndex={setCurrentCardIndex} setShowResults={setShowResults} />; 
    return <WelcomeScreen />;
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <ToolOptionsBar activeTool="flashcards" flashcardOptions={options} onFlashcardOptionsChange={(newOptions) => setOptions(prev => ({...prev, ...newOptions}))} />
      <div className="flex-grow overflow-y-auto p-4 md:p-6">{renderContent()}</div>
      <InputArea onSubmit={generateFlashcards} onImport={handleImport} isLoading={isLoading} showImport={true} />
    </div>
  );
}

function WelcomeScreen() {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Wand className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-headline text-3xl font-bold mb-2">Flashcard Generator</h1>
          <p className="text-muted-foreground max-w-md">
              Paste in your text, and I'll automatically create a set of flashcards to help you study.
          </p>
      </div>
    );
  }

  interface FlashcardSessionProps {
    sessionCards: SessionCard[];
    setSessionCards: React.Dispatch<React.SetStateAction<SessionCard[]>>;
    currentCardIndex: number;
    setCurrentCardIndex: React.Dispatch<React.SetStateAction<number>>;
    setShowResults: React.Dispatch<React.SetStateAction<boolean>>;
  }
  
  function FlashcardSession({ sessionCards, setSessionCards, currentCardIndex, setCurrentCardIndex, setShowResults }: FlashcardSessionProps) {
    const [isFlipped, setIsFlipped] = useState(false);
    const startTimeRef = useRef<number | null>(null);
  
    const handleFlip = useCallback(() => {
        setIsFlipped(f => !f);
        if (!isFlipped) { // Flipping to back
            const endTime = Date.now();
            if (startTimeRef.current !== null) {
                const timeSpent = (endTime - startTimeRef.current) / 1000;
                const newCards = [...sessionCards];
                newCards[currentCardIndex].timeSpent += timeSpent;
                newCards[currentCardIndex].flips += 1;
                setSessionCards(newCards);
            }
        } else { // Flipping back to front
            startTimeRef.current = Date.now();
        }
    }, [isFlipped, currentCardIndex, sessionCards, setSessionCards]);

    useEffect(() => {
        setIsFlipped(false);
        startTimeRef.current = Date.now();
    }, [currentCardIndex]);

    const handleMarkCorrect = (isCorrect: boolean) => {
        const newCards = [...sessionCards];
        newCards[currentCardIndex].isCorrect = isCorrect;
        setSessionCards(newCards);
        if (currentCardIndex < sessionCards.length - 1) {
            setCurrentCardIndex(currentCardIndex + 1);
        } else {
            setShowResults(true);
        }
    };
    
    const currentCard = sessionCards[currentCardIndex];

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <Progress value={((currentCardIndex + 1) / sessionCards.length) * 100} className="w-full" />
            <p className="text-sm text-muted-foreground text-center font-medium">Card {currentCardIndex + 1} of {sessionCards.length}</p>
            <div className="relative h-[400px] w-full perspective-1000">
                 <AnimatePresence>
                    <motion.div
                        key={currentCardIndex}
                        className="absolute w-full h-full preserve-3d"
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -300, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <motion.div 
                            className="w-full h-full relative preserve-3d"
                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                            transition={{ duration: 0.5 }}
                            style={{ transformStyle: 'preserve-3d' }}
                        >
                            {/* Front of the Card */}
                            <Card className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 text-center">
                                <CardContent className="flex items-center justify-center text-3xl font-bold"><Markdown>{currentCard.front}</Markdown></CardContent>
                            </Card>
                            {/* Back of the Card */}
                            <Card className="absolute w-full h-full backface-hidden [transform:rotateY(180deg)] flex flex-col p-6 text-center">
                                 <CardContent className="flex-grow flex flex-col items-center justify-center space-y-4">
                                    <p className="text-xl"><Markdown>{currentCard.back}</Markdown></p>
                                    {currentCard.explanation && (
                                        <p className="text-sm text-muted-foreground italic"><Markdown>{currentCard.explanation}</Markdown></p>
                                    )}
                                </CardContent>
                                <FollowUpQandA card={currentCard} />
                            </Card>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            </div>
            <div className="flex justify-center">
                 <Button onClick={handleFlip} size="lg" className="px-10 py-6 text-lg">
                    {isFlipped ? 'Flip to Front' : 'Flip to Back'}
                </Button>
            </div>

            {isFlipped && (
                <div className="flex justify-around items-center p-4 bg-muted rounded-lg">
                    <p className="font-semibold">Did you get it right?</p>
                    <div className="flex gap-4">
                        <Button onClick={() => handleMarkCorrect(true)} variant="success" size="lg">Yes <ChevronsRight className="ml-2" /></Button>
                        <Button onClick={() => handleMarkCorrect(false)} variant="destructive" size="lg">No <ChevronsRight className="ml-2" /></Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function FollowUpQandA({ card }: { card: SessionCard }) {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [isHintLoading, setIsHintLoading] = useState(false);
    const { globalModel, modelOverrides, apiKeys } = useApp();
    
    const getProviderFromModel = (model: string) => model.startsWith('gemini') ? 'google' : 'openai';

    const handleAskQuestion = async () => {
        if (!question.trim()) return;
        setIsHintLoading(true);
        setAnswer('');
        const model = modelOverrides.flashcards || globalModel;
        const provider = getProviderFromModel(model);
        const apiKey = apiKeys[provider];

        if (!apiKey) {
            setAnswer("Could not get answer: API key is not set.");
            setIsHintLoading(false);
            return;
        }

        try {
            const hintText = await handleGetHint({ question: `Regarding the flashcard "${card.front}" / "${card.back}", the user has the following question: "${question}"`, model, apiKey: { provider, key: apiKey } });
            setAnswer(hintText);
        } catch (e: any) {
            setAnswer(`Error getting answer: ${e.message}`);
        } finally {
            setIsHintLoading(false);
        }
    }

    return (
        <div className="mt-auto w-full pt-4 border-t text-left">
            <label htmlFor="follow-up" className="text-sm font-medium flex items-center mb-1">
                <HelpCircle className="w-4 h-4 mr-2"/>
                Ask a follow-up question
            </label>
            <div className="relative">
                <Textarea
                    id="follow-up"
                    placeholder="e.g., Explain this in simpler terms..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="pr-12"
                    disabled={isHintLoading}
                />
                <Button 
                    type="submit" 
                    size="icon" 
                    className="absolute right-2 top-1/2 -translate-y-1/2" 
                    disabled={isHintLoading || !question.trim()}
                    onClick={handleAskQuestion}
                >
                    {isHintLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
            </div>
            {answer && (
                <div className="mt-2 text-sm text-muted-foreground bg-slate-100 dark:bg-slate-800 p-3 rounded-md">
                    <Markdown>{answer}</Markdown>
                </div>
            )}
        </div>
    )
}

interface ResultsScreenProps {
  sessionCards: SessionCard[];
  onReviewAll: () => void;
  onRetryIncorrect: () => void;
  onRetryStruggled: () => void;
  allCards: SessionCard[];
  originalSessionResults: SessionCard[] | null;
}

function ResultsScreen({ sessionCards, onReviewAll, onRetryIncorrect, onRetryStruggled, allCards, originalSessionResults }: ResultsScreenProps) {
    const totalCards = sessionCards.length;
    const correctCards = sessionCards.filter(card => card.isCorrect).length;
    const score = totalCards > 0 ? (correctCards / totalCards) * 100 : 0;
    const incorrectCardsCount = sessionCards.filter(c => c.isCorrect === false).length;
    const struggledCardsCount = sessionCards.filter(c => c.timeSpent > 5).length;

    return (
        <div className="mx-auto max-w-3xl text-center space-y-6">
            <Card className="p-8 text-center">
                 <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
                <h1 className="text-4xl font-bold font-headline">Session Complete!</h1>
                <p className="text-xl text-muted-foreground mt-2">You reviewed {totalCards} cards.</p>
                 <div className="mt-8 text-5xl font-bold">{score.toFixed(0)}<span className="text-3xl text-muted-foreground">%</span></div>
                <p className="text-lg text-muted-foreground mt-1">You marked {correctCards} out of {totalCards} as correct.</p>
            </Card>
             <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" onClick={onRetryIncorrect} disabled={incorrectCardsCount === 0}><Repeat className="mr-2" /> Retry {incorrectCardsCount} Incorrect</Button>
                <Button size="lg" variant="outline" onClick={onRetryStruggled} disabled={struggledCardsCount === 0}><Star className="mr-2" /> Retry {struggledCardsCount} Struggled</Button>
            </div>
            <Separator />
             <Accordion type="single" collapsible className="w-full text-left">
                <AccordionItem value="item-1">
                    <AccordionTrigger className="text-xl">Review All Cards ({allCards.length})</AccordionTrigger>
                    <AccordionContent>
                         <div className="space-y-4 p-2 max-h-72 overflow-y-auto">
                            {allCards.map((card, index) => (
                                <div key={index} className="p-4 border rounded-md">
                                    <p className="font-semibold text-lg">{card.front}</p>
                                    <p className="text-muted-foreground">{card.back}</p>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
             <div className="flex flex-col sm:flex-row justify-center gap-4 hide-on-print pt-4">
                <Button size="lg" onClick={onReviewAll}>Review All Again <ArrowRight className="ml-2" /></Button>
            </div>
        </div>
    );
}
