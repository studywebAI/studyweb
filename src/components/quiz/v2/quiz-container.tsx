
'use client';

import { useState, useTransition, useEffect } from 'react';
import { QuestionCardV2 } from './question-card';
import { saveAnswer } from '@/app/actions/quiz-actions';
import { generateAndAddSurvivalQuestions } from '@/app/actions/teacher-actions';
import { Button } from '@/components/ui/button';
import { ArrowRight, Volume2, VolumeX, ShieldAlert, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Question, Quiz, QuizAttempt } from '@/types/database';


export function QuizContainerV2({ initialQuestions, attempt, quiz }: { initialQuestions: Question[], attempt: QuizAttempt, quiz: Quiz }) {
  const [questions, setQuestions] = useState(initialQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSurvivalPenalty, startSurvivalTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    // This allows the questions list to be updated from the server (e.g., in survival mode)
    setQuestions(initialQuestions);
  }, [initialQuestions]);


  const handleAnswer = async (answer: any) => {
    const question = questions[currentQuestionIndex];
    const result = await saveAnswer(attempt.id, question.id, answer);

    if (result.is_correct) {
      setScore(score + 1);
    } else if (attempt.mode === 'survival') {
        startSurvivalTransition(async () => {
            toast({
                title: "Incorrect!",
                description: "AI is generating 3 penalty questions...",
            });

            const penaltyResult = await generateAndAddSurvivalQuestions(
                attempt.id,
                quiz.subject_id as string,
                question.question_text
            );

            if (penaltyResult.success && penaltyResult.newQuestionIds) {
                toast({
                    title: "Penalty Added!",
                    description: "3 new questions have been added to the end of your quiz. Good luck.",
                    variant: 'destructive'
                });
                // Fetch the new questions from the server to add to state
                 const { data: newQuestionsData, error } = await attempt.supabase
                    .from('questions')
                    .select('*')
                    .in('id', penaltyResult.newQuestionIds);

                if (error) {
                    console.error("Failed to fetch new penalty questions", error);
                } else if (newQuestionsData) {
                    // Add new questions to the end of the current session
                    setQuestions(prev => [...prev, ...newQuestionsData]);
                }
            } else {
                 toast({
                    title: "Error",
                    description: penaltyResult.message,
                    variant: 'destructive'
                });
            }
        });
    }
    
    setIsAnswered(true);
    // TODO: Play sound based on correctness
    return result;
  };

  const handleNextQuestion = () => {
      setIsAnswered(false);
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < questions.length) {
        setCurrentQuestionIndex(nextIndex);
      } else {
        setIsFinished(true);
      }
  }

  if (isFinished) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Quiz Finished!</h2>
        <p className="text-xl mt-4">Your score: {score} / {questions.length}</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = (currentQuestionIndex + 1) / questions.length * 100;

  return (
    <div className='w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-gray-50 dark:bg-gray-900'>
      <div className="w-full max-w-4xl">
        <header className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center">
            {attempt.mode}
            {attempt.mode === 'survival' && <ShieldAlert className="w-4 h-4 ml-2 text-red-500"/>}
          </div>
          <div className="w-full max-w-xs mx-auto">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div className="h-full bg-primary rounded-full transition-all duration-500 ease-in-out" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-1">{currentQuestionIndex + 1} / {questions.length}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </header>
        <main className="relative">
             {isSurvivalPenalty && (
                <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10 rounded-2xl">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="mt-4 font-semibold text-lg">Applying Penalty...</p>
                </div>
            )}
            <QuestionCardV2 
                key={currentQuestion.id}
                question={currentQuestion} 
                onAnswer={handleAnswer} 
                mode={attempt.mode}
                isAnswered={isAnswered}
            />
        </main>
        <footer className="flex items-center justify-center mt-6">
            {isAnswered && <Button onClick={handleNextQuestion} className="rounded-full px-8 py-3 text-lg font-bold shadow-lg hover:shadow-xl transition-shadow duration-300">Next Question <ArrowRight className='w-5 h-5 ml-2'/></Button>}
        </footer>
      </div>
    </div>
  );
}
