'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Lightbulb, CheckCircle2, XCircle, ChevronRight, Loader2, AlertTriangle, Printer, Download } from 'lucide-react';
import { ToolOptionsBar, type QuizOptions } from '../tool-options-bar';
import { InputArea } from '../input-area';
import { handleGenerateQuiz, handleGradeAnswer } from '@/app/actions';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn, downloadFile } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';
import { useApp, type StudySession } from '../app-provider';
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
    isCorrect: boolean;
    grade: Grade;
    gradeExplanation: string;
}

function getProviderFromModel(model: string): 'openai' | 'google' {
    if (model.startsWith('gemini')) return 'google';
    return 'openai';
}

// --- Main Quiz Tool Component ---
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

  const { addSession, globalModel, modelOverrides, apiKeys, isSettingsLoaded } = useApp();

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
    if (!isSettingsLoaded) {
        setError("Settings not loaded yet. Please wait a moment.");
        return;
    }
    setIsLoading(!forRetry);
    setIsRetrying(forRetry);
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
          options: { questionCount: options.questionCount, difficulty: options.difficulty } 
        });
      
      startQuiz(result.questions, text);

      if(!forRetry) {
        addSession({
          title: `Quiz on: ${text.substring(0, 40)}...`,
          type: 'quiz',
          source_text: text,
          content: result
        });
      }
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  const handleImport = (item: StudySession) => {
    if (item.source_text) {
        generateQuiz(item.source_text);
    } else {
        // Fallback for older sessions that might not have source_text
        console.warn('Importing session without source_text, using fallback.');
        let importText = '';
        if (typeof item.content === 'string') {
            importText = item.content;
        } else if (item.type === 'quiz' && item.content.questions) {
            startQuiz(item.content.questions, item.title);
            return;
        } else if (item.type === 'flashcards' && item.content.cards) {
             importText = "Generate a quiz based on the following flashcard material:\n\n" + item.content.cards
                    .map((card: any) => `Card Front: "${card.front}"\nCard Back: "${card.back}"`)
                    .join('\n\n---\n\n');
        }

        if (importText) {
            generateQuiz(importText);
        } else {
             setError("Could not import this session. The content is in an unexpected format or empty.");
        }
    }
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
            return handleGradeAnswer({ question: q.question, correctAnswer: q.correctAnswer, userAnswer, model, apiKey: { provider, key: apiKey } });
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
        setError(e.message || 'An unknown error occurred during grading.');
    } finally {
        setIsGrading(false);
    }
  };

  const handleNextQuestion = (currentAnswer: string) => {
    const newAnswers = {...userAnswers, [currentQuestionIndex]: currentAnswer};
    setUserAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleFinishQuiz();
    }
  };
  
  const handleRetryIncorrect = async () => {
    const incorrectQuestions = gradedAnswers.filter(a => a.grade !== 'correct').map(a => questions[a.questionIndex]);
    if (incorrectQuestions.length === 0) return;

    const newPrompt = `The user previously answered questions on the following topics incorrectly. Generate a new quiz with ${incorrectQuestions.length} questions to test these specific topics again. The new questions should be different from the original ones but test the same concepts.\n\nIncorrectly Answered Topics:\n` + incorrectQuestions.map(q => `Question: ${q.question}\nCorrect Answer: ${q.correctAnswer}`).join('\n');

    await generateQuiz(newPrompt, true);
  }

  const renderContent = () => {
    if (!isSettingsLoaded) return <SettingsLoadingScreen />;
    if (isLoading) return <LoadingScreen />;
    if (isGrading) return <GradingScreen />;
    if (error) return <ErrorDisplay message={error} />;
    if (showResults) return <ResultsScreen questions={questions} gradedAnswers={gradedAnswers} onRetry={handleRetryIncorrect} onReviewAll={() => startQuiz(questions, sourceText)} isRetrying={isRetrying} />;
    if (questions.length > 0) return <QuizView key={currentQuestionIndex} question={questions[currentQuestionIndex]} questionNumber={currentQuestionIndex + 1} totalQuestions={questions.length} initialAnswer={userAnswers[currentQuestionIndex] || ''} onNext={handleNextQuestion} isLastQuestion={currentQuestionIndex === questions.length - 1} />;
    return <WelcomeScreen />;
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <ToolOptionsBar activeTool="quiz" quizOptions={options} onQuizOptionsChange={handleOptionsChange} />
      <div className="flex-grow overflow-y-auto">{renderContent()}</div>
      <div className="hide-on-print"><InputArea onSubmit={generateQuiz} onImport={handleImport} isLoading={isLoading || !isSettingsLoaded} showImport={true}/></div>
    </div>
  );
}


// --- Child Components for QuizTool ---

const QuizView = ({ question, questionNumber, totalQuestions, initialAnswer, onNext, isLastQuestion }: { question: Question, questionNumber: number, totalQuestions: number, initialAnswer: string, onNext: (answer: string) => void, isLastQuestion: boolean }) => {
    const [answer, setAnswer] = useState(initialAnswer);

    const handleNext = () => {
        onNext(answer);
    }

    const inputRef = React.useRef<HTMLInputElement>(null);
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
      <div className="mx-auto max-w-3xl p-4 md:p-6 hide-on-print">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">
              Question {questionNumber} of {totalQuestions}
            </CardTitle>
            <p className="pt-4 text-2xl font-semibold">{question.question}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
                <Label htmlFor={`answer-input-${questionNumber}`} className="text-lg">Your Answer</Label>
                <Input
                    ref={inputRef}
                    id={`answer-input-${questionNumber}`}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="text-lg p-6"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleNext();
                        }
                    }}
                />
            </div>
            
            <div className="mt-8 flex justify-end">
                <Button onClick={handleNext} size="lg" className="text-lg p-6">
                    {isLastQuestion ? 'Finish & Grade Quiz' : 'Next Question'}
                    <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

const ResultsScreen = ({ questions, gradedAnswers, onRetry, onReviewAll, isRetrying }: { questions: Question[], gradedAnswers: Answer[], onRetry: () => void, onReviewAll: () => void, isRetrying: boolean }) => {
    const { correctAnswersCount, partiallyCorrectCount, incorrectCount, score } = useMemo(() => {
        const correctAnswersCount = gradedAnswers.filter(a => a.grade === 'correct').length;
        const partiallyCorrectCount = gradedAnswers.filter(a => a.grade === 'partially_correct').length;
        const totalQuestions = questions.length;
        const score = totalQuestions > 0 ? ((correctAnswersCount + partiallyCorrectCount * 0.5) / totalQuestions) * 100 : 0;
        const incorrectCount = totalQuestions - correctAnswersCount - partiallyCorrectCount;
        return { correctAnswersCount, partiallyCorrectCount, incorrectCount, score };
    }, [gradedAnswers, questions]);

    const handleDownload = () => {
        const dataToSave = { score: score.toFixed(0) + '%', results: questions.map((q, index) => { const userAnswer = gradedAnswers.find(a => a.questionIndex === index); return { question: q.question, submittedAnswer: userAnswer?.submittedAnswer || "", correctAnswer: q.correctAnswer, grade: userAnswer?.grade || 'incorrect', explanation: userAnswer?.gradeExplanation || 'N/A' }; }) };
        downloadFile(JSON.stringify(dataToSave, null, 2), `quiz_results.json`, 'application/json');
    };

    return (
        <div className="mx-auto max-w-4xl p-4 md:p-6 printable-content">
            <Card className="shadow-lg">
                <CardHeader className="relative text-center">
                    <h1 className="font-headline text-5xl font-bold">Quiz Complete!</h1>
                    <CardDescription className="text-xl mt-2">Here's how you did.</CardDescription>
                     <div className="absolute top-4 right-4 flex items-center gap-1 hide-on-print">
                        <Button variant="ghost" size="icon" onClick={handleDownload}><Download className="h-5 w-5" /><span className="sr-only">Download</span></Button>
                        <Button variant="ghost" size="icon" onClick={() => window.print()}><Printer className="h-5 w-5" /><span className="sr-only">Print</span></Button>
                     </div>
                </CardHeader>
                <CardContent className="space-y-8 p-8">
                    <div className="text-center">
                        <div className="text-8xl font-bold text-primary">{score.toFixed(0)}%</div>
                        <p className="text-xl text-muted-foreground mt-2">{correctAnswersCount} correct, {partiallyCorrectCount} partially correct, {incorrectCount} incorrect.</p>
                    </div>
                    
                    <Accordion type="single" collapsible className="w-full">
                       {questions.map((q, index) => {
                            const userAnswer = gradedAnswers.find(a => a.questionIndex === index);
                            if (!userAnswer) return null;
                            
                            const getIcon = (grade: Grade) => {
                                switch(grade) {
                                    case 'correct': return <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />;
                                    case 'partially_correct': return <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0" />;
                                    case 'incorrect': return <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />;
                                }
                            }
                            
                            return (
                                <AccordionItem value={`item-${index}`} key={index}>
                                    <AccordionTrigger className="text-xl">
                                        <div className="flex items-center gap-4 w-full pr-4 text-left">
                                            {getIcon(userAnswer.grade)}
                                            <span className="flex-grow">{q.question}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="space-y-6 pt-4">
                                        <div>
                                            <p className="font-semibold text-lg">Your Answer:</p>
                                            <p className={cn("text-muted-foreground text-lg pl-4 border-l-4 ml-2", { 'border-green-500': userAnswer.grade === 'correct', 'border-yellow-500': userAnswer.grade === 'partially_correct', 'border-red-500': userAnswer.grade === 'incorrect' })}>{userAnswer.submittedAnswer || <em>(No answer)</em>}</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-lg">Grading Explanation:</p>
                                            <p className="text-muted-foreground text-lg pl-4 border-l-2 border-gray-300 ml-2">{userAnswer.gradeExplanation}</p>
                                        </div>
                                        {userAnswer.grade !== 'correct' && (
                                            <div>
                                                <p className="font-semibold text-lg">Ideal Answer:</p>
                                                <p className="text-muted-foreground text-lg pl-4 border-l-2 border-blue-500 ml-2">{q.correctAnswer}</p>
                                            </div>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            )
                       })}
                    </Accordion>
                    
                    <div className="flex justify-center gap-4 pt-6 hide-on-print">
                        <Button size="lg" className="text-lg p-6" onClick={onReviewAll}>Review All Again</Button>
                        <Button size="lg" className="text-lg p-6" variant="outline" onClick={onRetry} disabled={incorrectCount + partiallyCorrectCount === 0 || isRetrying}>
                            {isRetrying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Retry Incorrect
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

const WelcomeScreen = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 hide-on-print">
        <div className="bg-primary/10 p-4 rounded-full mb-4"><Lightbulb className="w-10 h-10 text-primary" /></div>
        <h1 className="font-headline text-3xl font-bold mb-2">Quiz Generator</h1>
        <p className="text-muted-foreground max-w-md">Provide some text, and I'll create a quiz to test your knowledge. You can import existing summaries too.</p>
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
    <div className="mx-auto max-w-3xl p-4 md:p-6 space-y-8 hide-on-print">
        <div className="space-y-4"><Skeleton className="h-10 w-3/4" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-5/6" /></div>
        <div className="space-y-4"><Skeleton className="h-12 w-full" /></div>
        <div className="flex justify-end"><Skeleton className="h-12 w-36" /></div>
    </div>
);

const GradingScreen = () => (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center hide-on-print">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-3xl font-semibold">Grading your answers...</h2>
        <p className="text-muted-foreground text-lg mt-2">Please wait while the AI evaluates your responses.</p>
    </div>
);

const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center h-full p-8">
        <Alert variant="destructive" className="max-w-lg">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
        </Alert>
    </div>
);
