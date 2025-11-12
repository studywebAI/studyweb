'use client';

import React, { useState } from 'react';
import { Lightbulb, CheckCircle2, XCircle, ChevronRight, Loader2, AlertTriangle, Printer } from 'lucide-react';
import { ToolOptionsBar, type QuizOptions } from '../tool-options-bar';
import { InputArea } from '../input-area';
import { handleGenerateQuiz, handleGradeAnswer } from '@/app/actions';
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

type Grade = 'correct' | 'incorrect' | 'partially_correct';

interface Answer {
    questionIndex: number;
    submittedAnswer: string;
    isCorrect: boolean; // Maintained for simple scoring, but grade is the source of truth
    grade: Grade;
    gradeExplanation: string;
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
  const [isGrading, setIsGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{[key: number]: string}>({});
  const [gradedAnswers, setGradedAnswers] = useState<Answer[]>([]);
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
    setUserAnswers({});
    setGradedAnswers([]);
    setShowResults(false);
    setError(null);
  };
  
  const generateQuiz = async (text: string, forRetry: boolean = false) => {
    if(!forRetry) {
        setIsLoading(true);
    } else {
        setIsRetrying(true);
    }
    setError(null);
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

  const handleFinishQuiz = async () => {
    setIsGrading(true);
    setError(null);

    const model = modelOverrides.quiz || globalModel;
    const provider = getProviderFromModel(model);
    const apiKey = apiKeys[provider];

    if (!apiKey) {
        setError(`API key for ${provider} is not set. Please add it in Settings.`);
        setIsGrading(false);
        return;
    }
    
    try {
        const gradePromises = questions.map((q, index) => {
            const userAnswer = userAnswers[index] || "";
            return handleGradeAnswer({
                question: q.question,
                correctAnswer: q.correctAnswer,
                userAnswer: userAnswer,
                model,
                apiKey: { provider, key: apiKey }
            });
        });

        const grades = await Promise.all(gradePromises);

        const finalAnswers: Answer[] = grades.map((gradeResult, index) => ({
            questionIndex: index,
            submittedAnswer: userAnswers[index] || "",
            isCorrect: gradeResult.grade === 'correct',
            grade: gradeResult.grade,
            gradeExplanation: gradeResult.explanation,
        }));
        
        setGradedAnswers(finalAnswers);
        setShowResults(true);

    } catch (e: any) {
        const errorMessage = e.message || 'An unknown error occurred during grading.';
        console.error('Error grading quiz:', e);
        setError(errorMessage);
    } finally {
        setIsGrading(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleFinishQuiz();
    }
  };

  const handleReviewAllAgain = () => {
    startQuiz(questions, sourceText);
  }

  const handleRetryIncorrect = async () => {
    const incorrectQuestions = gradedAnswers.filter(a => a.grade !== 'correct').map(a => questions[a.questionIndex]);
    if (incorrectQuestions.length === 0) return;

    const incorrectContext = incorrectQuestions.map(q => `
        Question: ${q.question}
        Correct Answer: ${q.correctAnswer}
    `).join('\n');

    const newPrompt = `
        The user previously answered questions on the following topics incorrectly or partially correctly.
        Generate a new quiz with ${incorrectQuestions.length} questions to test these specific topics again.
        The new questions should be different from the original ones but test the same concepts.
        
        Incorrectly Answered Topics:
        ${incorrectContext}
    `;

    await generateQuiz(newPrompt, true);
  }

  const handleAnswerChange = (index: number, value: string) => {
    setUserAnswers(prev => ({...prev, [index]: value}));
  }

  const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <Alert variant="destructive" className="max-w-lg">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </div>
  );

  const WelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 hide-on-print">
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
     <div className="mx-auto max-w-2xl p-4 md:p-6 space-y-8 hide-on-print">
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
    const correctAnswersCount = gradedAnswers.filter(a => a.grade === 'correct').length;
    const partiallyCorrectCount = gradedAnswers.filter(a => a.grade === 'partially_correct').length;
    const totalQuestions = questions.length;
    // Award half point for partially correct
    const score = totalQuestions > 0 ? ((correctAnswersCount + partiallyCorrectCount * 0.5) / totalQuestions) * 100 : 0;
    const incorrectCount = totalQuestions - correctAnswersCount - partiallyCorrectCount;

    return (
        <div className="mx-auto max-w-2xl p-4 md:p-6 printable-content">
            <Card>
                <CardHeader className="relative">
                    <CardTitle className="text-center">Quiz Complete!</CardTitle>
                    <CardDescription className="text-center">
                        Here's how you did.
                    </CardDescription>
                     <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 h-8 w-8 hide-on-print"
                        onClick={() => window.print()}
                      >
                        <Printer className="h-5 w-5" />
                        <span className="sr-only">Save as PDF</span>
                      </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="text-center">
                        <div className="text-6xl font-bold text-primary">{score.toFixed(0)}%</div>
                        <p className="text-lg text-muted-foreground">
                            {correctAnswersCount} correct, {partiallyCorrectCount} partially correct, {incorrectCount} incorrect.
                        </p>
                    </div>
                    
                    <Accordion type="single" collapsible className="w-full">
                       {questions.map((q, index) => {
                            const userAnswer = gradedAnswers.find(a => a.questionIndex === index);
                            if (!userAnswer) return null;
                            
                            const getIcon = () => {
                                switch(userAnswer.grade) {
                                    case 'correct': return <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />;
                                    case 'partially_correct': return <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />;
                                    case 'incorrect': return <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />;
                                }
                            }
                            
                            return (
                                <AccordionItem value={`item-${index}`} key={index}>
                                    <AccordionTrigger>
                                        <div className="flex items-center gap-4 w-full pr-4">
                                            {getIcon()}
                                            <span className="text-left flex-grow">{q.question}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-4">
                                        <div>
                                            <p className="font-semibold">Your Answer:</p>
                                            <p className={cn("text-muted-foreground pl-4 border-l-2 ml-2", {
                                                'border-green-500': userAnswer.grade === 'correct',
                                                'border-yellow-500': userAnswer.grade === 'partially_correct',
                                                'border-red-500': userAnswer.grade === 'incorrect',
                                            })}>
                                               {userAnswer.submittedAnswer || <em>(No answer submitted)</em>}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="font-semibold">Grading Explanation:</p>
                                            <p className="text-muted-foreground pl-4 border-l-2 border-gray-300 ml-2">
                                                {userAnswer.gradeExplanation}
                                            </p>
                                        </div>

                                        {userAnswer.grade !== 'correct' && (
                                            <div>
                                                <p className="font-semibold">Ideal Answer:</p>
                                                <p className="text-muted-foreground pl-4 border-l-2 border-blue-500 ml-2">
                                                    {q.correctAnswer}
                                                </p>
                                            </div>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            )
                       })}
                    </Accordion>
                    
                    <div className="flex justify-center gap-4 pt-4 hide-on-print">
                        <Button onClick={handleReviewAllAgain}>Review All Again</Button>
                        <Button 
                            variant="outline"
                            onClick={handleRetryIncorrect}
                            disabled={incorrectCount + partiallyCorrectCount === 0 || isRetrying}
                        >
                            {isRetrying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Retry {incorrectCount + partiallyCorrectCount} Incorrect
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
      <div className="mx-auto max-w-2xl p-4 md:p-6 hide-on-print">
        <Card>
          <CardHeader>
            <CardTitle>
              Question {currentQuestionIndex + 1} of {questions.length}
            </CardTitle>
            <p className="pt-4 text-lg font-medium">{currentQuestion.question}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
                <Label htmlFor={`answer-input-${currentQuestionIndex}`}>Your Answer</Label>
                <Input
                    id={`answer-input-${currentQuestionIndex}`}
                    value={userAnswers[currentQuestionIndex] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestionIndex, e.target.value)}
                    placeholder="Type your answer here..."
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleNextQuestion();
                        }
                    }}
                />
            </div>
            
            <div className="mt-6 flex justify-end">
                <Button onClick={handleNextQuestion}>
                    {currentQuestionIndex === questions.length - 1 ? 'Finish & Grade Quiz' : 'Next Question'}
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
    if (isGrading) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center hide-on-print">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <h2 className="text-2xl font-semibold">Grading your answers...</h2>
                <p className="text-muted-foreground">Please wait while the AI evaluates your responses.</p>
            </div>
        )
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
      <div className="hide-on-print">
        <InputArea onSubmit={generateQuiz} onImport={handleImport} isLoading={isLoading} showImport={true}/>
      </div>
    </div>
  );
}
