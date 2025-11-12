'use client';

import React, { useState } from 'react';
import { Lightbulb, CheckCircle2, XCircle, ChevronRight, Loader2, Circle } from 'lucide-react';
import { ToolOptionsBar, type QuizOptions } from '../tool-options-bar';
import { InputArea } from '../input-area';
import { handleGenerateQuiz } from '@/app/actions';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { useApp, type RecentItem } from '../app-provider';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';


interface Question {
  question: string;
  correctAnswer: string;
  explanation: string;
}

interface Answer {
    questionIndex: number;
    submittedAnswer: string;
    isCorrect: boolean; // This will be updated by AI grading later
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
  const [sourceText, setSourceText] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);


  const { addRecent, globalModel, modelOverrides, apiKeys } = useApp();

  const handleOptionsChange = (newOptions: Partial<QuizOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  };

  const startQuiz = (quizQuestions: Question[], originalText: string) => {
    setQuestions(quizQuestions);
    setSourceText(originalText);
    setCurrentQuestionIndex(0);
    setUserAnswer('');
    setAnswers([]);
    setShowResults(false);
    setError(null);
  };
  
  const generateQuiz = async (text: string, forRetry: boolean = false) => {
    if(!forRetry) {
        setIsLoading(true);
    } else {
        setIsRetrying(true);
    }
    const model = modelOverrides.quiz || globalModel;
    const provider = getProviderFromModel(model);
    const apiKey = apiKeys[provider];

     if (!apiKey) {
        setError(`API key for ${provider} is not set. Please add it in Settings.`);
        setIsLoading(false);
        setIsRetrying(false);
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
      
      startQuiz(result.questions, text);

      if(!forRetry) {
        addRecent({
          title: text.substring(0, 30) + '...',
          type: 'Quiz',
          content: text,
        });
      }
    } catch (e: any) {
      const errorMessage = e.message || 'An unknown error occurred.';
      console.error('Error generating quiz:', e);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  const handleImport = (item: RecentItem) => {
    generateQuiz(item.content);
  };

  const handleNextQuestion = () => {
    // Save current answer
    const currentQuestion = questions[currentQuestionIndex];
    // A simple exact match for now. AI grading will replace this.
    const isCorrect = userAnswer.trim().toLowerCase() === currentQuestion.correctAnswer.toLowerCase();

    setAnswers([...answers, {
        questionIndex: currentQuestionIndex,
        submittedAnswer: userAnswer,
        isCorrect: isCorrect
    }]);

    // Move to next question or show results
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer('');
    } else {
      setShowResults(true);
    }
  };

  const handleReviewAllAgain = () => {
    startQuiz(questions, sourceText);
  }

  const handleRetryIncorrect = async () => {
    const incorrectQuestions = answers.filter(a => !a.isCorrect).map(a => questions[a.questionIndex]);
    if (incorrectQuestions.length === 0) return;

    const incorrectContext = incorrectQuestions.map(q => `
        Question: ${q.question}
        Correct Answer: ${q.correctAnswer}
        Explanation: ${q.explanation}
    `).join('\n');

    const newPrompt = `
        The user previously answered questions on the following topics incorrectly.
        Generate a new quiz with ${incorrectQuestions.length} questions to test these specific topics again.
        The new questions should be different from the original ones but test the same concepts.
        
        Incorrectly Answered Topics:
        ${incorrectContext}
    `;

    await generateQuiz(newPrompt, true);
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
        </div>
        <div className="flex justify-end">
            <Skeleton className="h-10 w-32" />
        </div>
     </div>
  );
  
  const ResultsScreen = () => {
    const correctAnswersCount = answers.filter(a => a.isCorrect).length;
    const totalQuestions = questions.length;
    const score = totalQuestions > 0 ? (correctAnswersCount / totalQuestions) * 100 : 0;
    const incorrectCount = totalQuestions - correctAnswersCount;

    return (
        <div className="mx-auto max-w-2xl p-4 md:p-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-center">Quiz Complete!</CardTitle>
                    <CardDescription className="text-center">
                        Here's how you did.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center">
                        <div className="text-6xl font-bold text-primary">{score.toFixed(0)}%</div>
                        <p className="text-xl text-muted-foreground">
                            You answered {correctAnswersCount} out of {totalQuestions} questions correctly.
                        </p>
                    </div>
                    
                    <Accordion type="single" collapsible className="w-full">
                       {questions.map((q, index) => {
                            const userAnswer = answers.find(a => a.questionIndex === index);
                            if (!userAnswer) return null;
                            
                            return (
                                <AccordionItem value={`item-${index}`} key={index}>
                                    <AccordionTrigger>
                                        <div className="flex items-center gap-4 w-full pr-4">
                                            {userAnswer.isCorrect ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                                            )}
                                            <span className="text-left flex-grow">{q.question}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-4">
                                        {!userAnswer.isCorrect && (
                                            <div>
                                                <p className="font-semibold">Your Answer:</p>
                                                <p className="text-muted-foreground pl-4 border-l-2 border-red-500 ml-2">
                                                   {userAnswer.submittedAnswer}
                                                </p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-semibold">Correct Answer:</p>
                                            <p className="text-muted-foreground pl-4 border-l-2 border-green-500 ml-2">
                                                {q.correctAnswer}
                                            </p>
                                        </div>
                                        <div>
                                             <p className="font-semibold">Explanation:</p>
                                             <p className="text-muted-foreground pl-4 border-l-2 border-gray-300 ml-2">{q.explanation}</p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )
                       })}
                    </Accordion>
                    
                    <div className="flex justify-center gap-4 pt-4">
                        <Button onClick={handleReviewAllAgain}>Review All Again</Button>
                        <Button 
                            variant="outline"
                            onClick={handleRetryIncorrect}
                            disabled={incorrectCount === 0 || isRetrying}
                        >
                            {isRetrying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Retry {incorrectCount} Incorrect
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
  }

  const QuizView = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return null;

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
            <div className="space-y-2">
                <Label htmlFor="answer-input">Your Answer</Label>
                <Input
                    id="answer-input"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleNextQuestion();
                        }
                    }}
                />
            </div>
            
            <div className="mt-6 flex justify-end">
                <Button onClick={handleNextQuestion} disabled={!userAnswer.trim()}>
                    {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                    <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
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
