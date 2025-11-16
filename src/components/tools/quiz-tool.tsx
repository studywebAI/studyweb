'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ToolOptionsBar, type QuizOptions } from '../tool-options-bar';
import { InputArea } from '../input-area';
import { handleGenerateQuiz } from '@/app/actions';
import { gradeAnswer as handleGradeAnswer } from '@/app/actions';
import { Bot, User, FileQuestion, ChevronLeft, ChevronRight, Check, X, AlertCircle, Sparkles, Loader2, ChevronsRight, BookOpen, Repeat, Star, Trophy } from 'lucide-react';
import { cn, downloadFile } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { useApp, type StudySession } from '../app-provider';
import Markdown from 'react-markdown';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { Separator } from '../ui/separator';

// Interfaces based on your described logic
interface Flashcard {
    front: string;
    back: string;
}

interface Question {
  question: string;
  correctAnswer: string;
  explanation: string;
  userAnswer?: string;
  isCorrect?: boolean;
  grade?: 'correct' | 'incorrect' | 'partially_correct';
  gradeExplanation?: string;
}


export function QuizTool() {
  const [options, setOptions] = useState<QuizOptions>({ questionCount: 10, difficulty: 'medium' });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const { addSession, globalModel, modelOverrides, apiKeys, isSettingsLoaded } = useApp();

  const getProviderFromModel = (model: string) => model.startsWith('gemini') ? 'google' : 'openai';

  const generateQuiz = async (text: string) => {
    if (!isSettingsLoaded) return;
    setIsLoading(true);
    setError(null);
    setQuestions([]);
    setShowResults(false);

    const model = modelOverrides.quiz || globalModel;
    const provider = getProviderFromModel(model);
    const userApiKey = apiKeys[provider];

    try {
      const result = await handleGenerateQuiz({ 
          summaryContent: text, 
          options, 
          model, 
          apiKey: userApiKey ? { provider, key: userApiKey } : null
      });
      setQuestions(result.questions);
      setCurrentQuestionIndex(0);
      addSession({ title: `Quiz on: ${text.substring(0, 30)}...`, type: 'quiz', content: result, source_text: text });
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = async (answer: string) => {
    const newQuestions = [...questions];
    const currentQuestion = newQuestions[currentQuestionIndex];
    currentQuestion.userAnswer = answer;
    
    // Set immediate visual feedback while grading
    setQuestions([...newQuestions]);

    const model = modelOverrides.quiz || globalModel;
    const provider = getProviderFromModel(model);
    const userApiKey = apiKeys[provider];

    try {
        const gradeResult = await handleGradeAnswer({
            question: currentQuestion.question,
            correctAnswer: currentQuestion.correctAnswer,
            userAnswer: answer,
            model,
            apiKey: userApiKey ? { provider, key: userApiKey } : null
        });

        currentQuestion.grade = gradeResult.grade;
        currentQuestion.gradeExplanation = gradeResult.explanation;
        currentQuestion.isCorrect = gradeResult.grade === 'correct';

    } catch(e: any) {
        console.error("Error grading answer:", e);
        // Fallback to simple comparison if AI grading fails
        currentQuestion.isCorrect = answer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
        currentQuestion.grade = currentQuestion.isCorrect ? 'correct' : 'incorrect';
        currentQuestion.gradeExplanation = currentQuestion.isCorrect ? 'Your answer is correct.' : `The correct answer is: ${currentQuestion.correctAnswer}`;
    } finally {
        setQuestions([...newQuestions]);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleRestart = () => {
    setQuestions(questions.map(q => ({ ...q, userAnswer: undefined, isCorrect: undefined, grade: undefined, gradeExplanation: undefined })));
    setCurrentQuestionIndex(0);
    setShowResults(false);
  };
  
  const handleImport = (item: StudySession) => {
    let importText = '';
    if (item.source_text) {
      importText = item.source_text;
    } else if (typeof item.content === 'string') {
      importText = item.content;
    } else if (item.type === 'quiz' && item.content && 'questions' in item.content) {
      const quizContent = item.content as { questions: Question[] };
      setQuestions(quizContent.questions.map(q => ({...q, userAnswer: undefined, isCorrect: undefined, grade: undefined, gradeExplanation: undefined})));
      setCurrentQuestionIndex(0);
      setShowResults(false);
      setError(null);
      return; 
    } else if (item.type === 'flashcards' && item.content && 'cards' in item.content) {
       const flashcardContent = item.content as { cards: Flashcard[] };
       importText = "Generate a quiz from the following flashcards:\n" + flashcardContent.cards.map(c => `Front: ${c.front}\nBack: ${c.back}`).join('\n---\n');
    } else {
        setError("Could not import this session. The content is in an unexpected format.");
        return;
    }

    if (importText) {
        generateQuiz(importText);
    }
  };


  const renderContent = () => {
    if (!isSettingsLoaded) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (isLoading && questions.length === 0) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
    if (showResults) return <ResultsScreen questions={questions} onRestart={handleRestart} onReview={() => setShowResults(false)} />;
    if (questions.length > 0) return <QuestionDisplay question={questions[currentQuestionIndex]} onAnswer={handleAnswer} onNext={handleNext} onPrevious={handlePrevious} isFirst={currentQuestionIndex === 0} isLast={currentQuestionIndex === questions.length - 1} currentIndex={currentQuestionIndex} totalQuestions={questions.length} />;
    return <WelcomeScreen />;
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <ToolOptionsBar activeTool="quiz" quizOptions={options} onQuizOptionsChange={(newOptions) => setOptions(prev => ({ ...prev, ...newOptions }))} />
      <div className="flex-grow overflow-y-auto p-4 md:p-6">{renderContent()}</div>
      <InputArea onSubmit={generateQuiz} onImport={handleImport} isLoading={isLoading} showImport={true} />
    </div>
  );
}

function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="bg-primary/10 p-4 rounded-full mb-4">
            <FileQuestion className="w-10 h-10 text-primary" />
        </div>
        <h1 className="font-headline text-3xl font-bold mb-2">Quiz Generator</h1>
        <p className="text-muted-foreground max-w-md">
            Paste in your study materials, and I'll create a quiz to help you test your knowledge.
        </p>
    </div>
  );
}

interface QuestionDisplayProps {
    question: Question;
    onAnswer: (answer: string) => void;
    onNext: () => void;
    onPrevious: () => void;
    isFirst: boolean;
    isLast: boolean;
    currentIndex: number;
    totalQuestions: number;
}

function QuestionDisplay({ question, onAnswer, onNext, onPrevious, isFirst, isLast, currentIndex, totalQuestions }: QuestionDisplayProps) {
    const [userAnswer, setUserAnswer] = useState('');
    
    useEffect(() => {
        // Reset local input when question changes
        setUserAnswer(question.userAnswer || '');
    }, [question]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (userAnswer.trim()) {
            onAnswer(userAnswer);
        }
    }

    const getGradeColor = (grade?: 'correct' | 'incorrect' | 'partially_correct') => {
        switch (grade) {
            case 'correct': return 'bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700';
            case 'incorrect': return 'bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700';
            case 'partially_correct': return 'bg-yellow-100 dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-700';
            default: return 'bg-muted';
        }
    };
    const getGradeIcon = (grade?: 'correct' | 'incorrect' | 'partially_correct') => {
        switch (grade) {
            case 'correct': return <Check className="h-5 w-5 mr-2 text-green-600" />;
            case 'incorrect': return <X className="h-5 w-5 mr-2 text-red-600" />;
            case 'partially_correct': return <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />;
            default: return null;
        }
    };

    return (
        <div className="mx-auto max-w-3xl space-y-6 text-lg">
            <Progress value={((currentIndex + 1) / totalQuestions) * 100} className="w-full mb-4" />
            <p className="text-sm text-muted-foreground text-center font-medium">Question {currentIndex + 1} of {totalQuestions}</p>
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold leading-tight">{question.question}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={handleSubmit}>
                        <Textarea
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder="Type your answer here..."
                            className="text-base"
                            rows={4}
                            disabled={!!question.grade}
                        />
                        <Button type="submit" className="mt-4" disabled={!userAnswer.trim() || !!question.grade}>Submit Answer</Button>
                    </form>
                    
                    {question.grade && (
                         <div className={cn('p-4 rounded-md mt-4 text-base border', getGradeColor(question.grade))}>
                            <h3 className="font-bold flex items-center mb-2">
                                {getGradeIcon(question.grade)}
                                {question.grade?.replace('_', ' ')}
                            </h3>
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <Markdown>{question.gradeExplanation || question.explanation}</Markdown>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            <div className="flex justify-between items-center mt-6">
                <Button variant="outline" onClick={handlePrevious} disabled={isFirst}><ChevronLeft className="mr-2 h-4 w-4" /> Previous</Button>
                <Button onClick={onNext} disabled={!question.grade} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                     {isLast ? 'Show Results' : 'Next'} <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

interface ResultsScreenProps {
    questions: Question[];
    onRestart: () => void;
    onReview: () => void;
}

function ResultsScreen({ questions, onRestart, onReview }: ResultsScreenProps) {
    const correctAnswers = questions.filter(q => q.grade === 'correct').length;
    const partiallyCorrectAnswers = questions.filter(q => q.grade === 'partially_correct').length;
    // Award half points for partially correct
    const score = ((correctAnswers + partiallyCorrectAnswers * 0.5) / questions.length) * 100;

    const getPerformanceMessage = () => {
        if (score === 100) return "Perfect Score! Truly a StudyGenius!";
        if (score >= 80) return "Great job! You've mastered this material.";
        if (score >= 60) return "Good effort! A little more practice and you'll be there.";
        return "Keep reviewing. You can do this!";
    }

    return (
        <div className="mx-auto max-w-3xl text-center space-y-6">
             <Card className="p-8 text-center">
                <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
                <h1 className="text-4xl font-bold font-headline">Quiz Complete!</h1>
                <p className="text-xl text-muted-foreground mt-2">{getPerformanceMessage()}</p>
                <div className="mt-8 text-5xl font-bold">{score.toFixed(0)}<span className="text-3xl text-muted-foreground">%</span></div>
                <p className="text-lg text-muted-foreground mt-1">You scored {correctAnswers} correct and {partiallyCorrectAnswers} partially correct out of {questions.length} questions.</p>
            </Card>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" onClick={onRestart}><Repeat className="mr-2" /> Retake Quiz</Button>
                <Button size="lg" variant="outline" onClick={onReview}><BookOpen className="mr-2" /> Review Answers</Button>
            </div>
            <Accordion type="single" collapsible className="w-full text-left">
                <AccordionItem value="item-1">
                    <AccordionTrigger className="text-xl">See All Questions & Answers</AccordionTrigger>
                    <AccordionContent>
                         <div className="space-y-4 p-2 max-h-96 overflow-y-auto">
                            {questions.map((q, index) => (
                                <div key={index} className={`p-4 border rounded-md ${q.grade === 'correct' ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : q.grade === 'partially_correct' ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20' : 'border-red-300 bg-red-50 dark:bg-red-900/20'}`}>
                                    <p className="font-semibold text-lg">{index + 1}. {q.question}</p>
                                    <p className={`mt-2 ${q.grade === 'correct' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>Your answer: {q.userAnswer}</p>
                                    <div className="mt-2 text-sm text-muted-foreground pt-2 border-t">
                                        <Markdown>{q.gradeExplanation || q.explanation}</Markdown>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}
