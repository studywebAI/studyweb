
'use client';

import { useState } from 'react';
import { QuestionCardV2 } from './question-card';
import { saveAnswer } from '@/app/actions/quiz-actions';
import { Button } from '@/components/ui/button';
import { ArrowRight, Volume2, VolumeX } from 'lucide-react';

export function QuizContainerV2({ questions, attemptId, mode }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const handleAnswer = async (answer) => {
    const question = questions[currentQuestionIndex];
    const result = await saveAnswer(attemptId, question.id, answer);

    if (result.is_correct) {
      setScore(score + 1);
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
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {mode}
          </div>
          <div className="w-full max-w-xs mx-auto">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </header>
        <main className="relative">
            <QuestionCardV2 
                key={currentQuestion.id}
                question={currentQuestion} 
                onAnswer={handleAnswer} 
                mode={mode}
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
