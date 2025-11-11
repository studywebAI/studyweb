'use client';

import React, { useState } from 'react';
import { Lightbulb, CheckCircle2, XCircle, ChevronRight, Loader2 } from 'lucide-react';
import { ToolOptionsBar } from '../tool-options-bar';
import { InputArea } from '../input-area';
import { generateQuizFromSummary } from '@/ai/flows/generate-quiz-from-summary';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export function QuizTool() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleSubmit = async (text: string) => {
    setIsLoading(true);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);

    try {
      const result = await generateQuizFromSummary({ summaryContent: text });
      setQuestions(result.questions);
    } catch (error) {
      console.error('Error generating quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    }
  };
  
  const handleAnswerSubmit = () => {
    setIsAnswered(true);
  }

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

  const QuizView = () => {
    const currentQuestion = questions[currentQuestionIndex];
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
                      "cursor-pointer hover:bg-accent",
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
                     <Button onClick={handleNextQuestion} disabled={currentQuestionIndex === questions.length - 1}>
                        Next Question <ChevronRight className="ml-2 h-4 w-4" />
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

  return (
    <div className="flex h-screen flex-col bg-background">
      <ToolOptionsBar
        activeTool="quiz"
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
        ) : questions.length > 0 ? (
          <QuizView />
        ) : (
          <WelcomeScreen />
        )}
      </div>
      <InputArea onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}
