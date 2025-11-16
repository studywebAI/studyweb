'use client';

import { useState } from 'react';
import { QuestionCard } from './question-card';
import { saveAnswer } from '@/app/actions/quiz-actions';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function QuizContainer({ questions, attemptId, mode }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleAnswer = async (answer) => {
    const question = questions[currentQuestionIndex];
    const result = await saveAnswer(attemptId, question.id, answer);

    if (result.is_correct) {
      setScore(score + 1);
    }
    setIsAnswered(true);
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

  return (
    <div className='w-full flex flex-col items-center space-y-4'>
      <QuestionCard 
        key={currentQuestion.id}
        question={currentQuestion} 
        onAnswer={handleAnswer} 
        mode={mode}
      />
      {isAnswered && <Button onClick={handleNextQuestion}>Next Question <ArrowRight className='w-4 h-4 ml-2'/></Button>}
    </div>
  );
}
