'use client';

import React, { useState } from 'react';
import { Lightbulb, CheckCircle2, XCircle, ChevronRight, Loader2 } from 'lucide-react';
import { ToolOptionsBar, type QuizOptions } from '../tool-options-bar';
import { InputArea } from '../input-area';
import { handleGenerateQuiz } from '@/app/actions';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { useApp, type RecentItem } from '../app-provider';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';


interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Answer {
    questionIndex: number;
    selectedAnswer: number | null;
    isCorrect: boolean;
}

// Helper function to determine the provider from a model name
function getProviderFromModel(model: string): 'openai' | 'google' {
    if (model.startsWith('gemini')) {
      return 'google';
    }
    return 'openai';
}

export function QuizTool() {
  const [options, setOptions] = useState<QuizOptions>({ questionCount: 10, difficulty: 'medium' });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showResults, setShowResults] = useState(false);

  const { addRecent, globalModel, modelOverrides, apiKeys } = useApp();

  const handleOptionsChange = (newOptions: Partial<QuizOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  };

  const generateQuiz = async (text: string) => {
    setIsLoading(true);
    setQuestions([]);
    setError(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setAnswers([]);
    setShowResults(false);
    
    const model = modelOverrides.quiz || globalModel;
    const provider = getProviderFromModel(model);
    const apiKey = apiKeys[provider];

     if (!apiKey) {
        setError(`API key for ${provider} is not set. Please add it in Settings.`);
        setIsLoading(false);
        return;
    }

    try {
      const result = await handleGenerateQuiz({ 
          summaryContent: text, 
          model, 
          apiKey: { provider, key: apiKey },
          options: { 
              questionCount: options.questionCount, 
              difficulty: options.difficulty 
            } 
        });
      setQuestions(result.questions);
      addRecent({
        title: text.substring(0, 30) + '...',
        type: 'Quiz',
        content: text,
      });
    } catch (e: any) {
      const errorMessage = e.message || 'An unknown error occurred.';
      console.error('Error generating quiz:', e);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = (item: RecentItem) => {
    generateQuiz(item.content);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
    }
  };
  
  const handleAnswerSubmit = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === questions[currentQuestionIndex].correctIndex;
    setAnswers([...answers, {
        questionIndex: currentQuestionIndex,
        selectedAnswer: selectedAnswer,
        isCorrect: isCorrect
    }]);
    setIsAnswered(true);
  }

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setAnswers([]);
    setShowResults(false);
  }

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
        <Lightbulb className="w-10 h-10 text-primary" />
      </div>
      <h1 className="font-headline text-3xl font-bold mb-2">Quiz Generator</h1>
      <p className="text-muted-foreground max-w-md">
        Provide some text, and I'll create a quiz to test your knowledge. You
        can import existing summaries too.
      </p>
    </div>
  );
  
  const LoadingScreen = () => (
     <div className="mx-auto max-w-2xl p-4 md:p-6 space-y-8">
        <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-full" />
             <Skeleton className="h-6 w-5/6" />
        </div>
         <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex justify-end">
            <Skeleton className="h-10 w-32" />
        </div>
     </div>
  );
  
  const ResultsScreen = () => {
    const correctAnswers = answers.filter(a => a.isCorrect).length;
    const totalQuestions = questions.length;
    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

    return (
        <div className="mx-auto max-w-2xl p-4 md:p-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-center">Quiz Complete!</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                    <div className="text-6xl font-bold text-primary">{score.toFixed(0)}%</div>
                    <p className="text-xl text-muted-foreground">
                        You answered {correctAnswers} out of {totalQuestions} questions correctly.
                    </p>
                    
                    <div className="flex justify-center gap-4">
                        <Button onClick={handleRestartQuiz}>Take Quiz Again</Button>
                        <Button variant="outline" disabled>Retry Incorrect</Button>
                    </div>
                    {/* Placeholder for detailed results */}
                </CardContent>
            </Card>
        </div>
    )
  }

  const QuizView = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return null; // Should not happen if questions.length > 0
    
    const isCorrect = selectedAnswer === currentQuestion.correctIndex;

    return (
      <div className="mx-auto max-w-2xl p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle>
              Question {currentQuestionIndex + 1} of {questions.length}
            </CardTitle>
            <p className="pt-4 text-lg font-medium">{currentQuestion.question}</p>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedAnswer?.toString()}
              onValueChange={(value) => setSelectedAnswer(parseInt(value))}
              disabled={isAnswered}
            >
              {currentQuestion.options.map((option, index) => {
                 const isCorrectOption = index === currentQuestion.correctIndex;
                 const isSelectedOption = index === selectedAnswer;

                return (
                  <Label
                    key={index}
                    className={cn(
                      "flex items-center gap-4 rounded-lg border p-4 transition-colors",
                      !isAnswered && "cursor-pointer hover:bg-accent",
                      isAnswered && "cursor-default",
                      isAnswered && isCorrectOption && "border-green-500 bg-green-500/10",
                      isAnswered && isSelectedOption && !isCorrectOption && "border-red-500 bg-red-500/10"
                    )}
                  >
                    <RadioGroupItem value={index.toString()} />
                    <span>{option}</span>
                     {isAnswered && isCorrectOption && <CheckCircle2 className="ml-auto h-5 w-5 text-green-500" />}
                    {isAnswered && isSelectedOption && !isCorrectOption && <XCircle className="ml-auto h-5 w-5 text-red-500" />}
                  </Label>
                )
              })}
            </RadioGroup>
            {isAnswered && (
                <div className={cn(
                    "mt-4 rounded-lg border p-4",
                    isCorrect ? "border-green-500/50 bg-green-500/10 text-green-800" : "border-red-500/50 bg-red-500/10 text-red-800",
                    "dark:text-white"
                )}>
                    <h4 className="font-bold">{isCorrect ? "Correct!" : "Incorrect"}</h4>
                    <p className="text-sm">{currentQuestion.explanation}</p>
                </div>
            )}
            <div className="mt-6 flex justify-end">
                {isAnswered ? (
                     <Button onClick={handleNextQuestion}>
                        {currentQuestionIndex === questions.length - 1 ? 'Show Results' : 'Next Question'}
                        <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button onClick={handleAnswerSubmit} disabled={selectedAnswer === null}>
                        Check Answer
                    </Button>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

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
    if (questions.length > 0) {
      return <QuizView />;
    }
    return <WelcomeScreen />;
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <ToolOptionsBar
        activeTool="quiz"
        quizOptions={options}
        onQuizOptionsChange={handleOptionsChange}
      />
      <div className="flex-grow overflow-y-auto">
        {renderContent()}
      </div>
      <InputArea onSubmit={generateQuiz} onImport={handleImport} isLoading={isLoading} showImport={true}/>
    </div>
  );
}
