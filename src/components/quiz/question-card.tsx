'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from '@/components/ui/textarea';
import { getHint, getExplanation } from '@/app/actions/ai-actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lightbulb, BookText, Loader2 } from 'lucide-react';

export function QuestionCard({ question, onAnswer, mode }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hint, setHint] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [isPending, startTransition] = useTransition();

  const handleGetHint = async () => {
    startTransition(async () => {
        const result = await getHint(question);
        if(result.success) setHint(result.content);
    });
  }

  const handleGetExplanation = async () => {
    startTransition(async () => {
        const result = await getExplanation(question);
        if(result.success) setExplanation(result.content);
    });
  }

  const handleSubmit = async () => {
    if (selectedAnswer !== null) {
      const result = await onAnswer(selectedAnswer);
      setIsAnswered(true);
      setIsCorrect(result.is_correct);
    }
  };

  const renderInput = () => {
    // Similar to before, but disabled after answering
    const isDisabled = isAnswered || isPending;
    switch (question.type) {
        case 'multiple_choice':
          return (
            <RadioGroup onValueChange={(value) => setSelectedAnswer({ key: value })} disabled={isDisabled}>
                {Object.entries(question.answers).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                        <RadioGroupItem value={key} id={key} />
                        <Label htmlFor={key}>{value as string}</Label>
                    </div>
                ))}
            </RadioGroup>
          );
        case 'true_false':
          return (
            <RadioGroup onValueChange={(value) => setSelectedAnswer({ is_true: value === 'true' })} disabled={isDisabled}>
              <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="true" />
                  <Label htmlFor="true">True</Label>
              </div>
              <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="false" />
                  <Label htmlFor="false">False</Label>
              </div>
          </RadioGroup>
          );
        case 'open_answer':
          return (
              <Textarea 
                  placeholder="Your answer..."
                  onChange={(e) => setSelectedAnswer({ text: e.target.value })}
                  disabled={isDisabled}
              />
          );
        default:
          return <p>Unsupported question type.</p>;
      }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{question.question_text}</CardTitle>
        <CardDescription>Difficulty: {question.difficulty}/10</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderInput()}
        {hint && 
            <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>Hint</AlertTitle>
                <AlertDescription>{hint}</AlertDescription>
            </Alert>
        }
        {isAnswered && 
            <Alert variant={isCorrect ? 'default' : 'destructive'}>
                <AlertTitle>{isCorrect ? "Correct!" : "Incorrect"}</AlertTitle>
                <AlertDescription>
                    {explanation ? explanation : (mode === 'practice' && <Button variant="link" onClick={handleGetExplanation} disabled={isPending}> {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><BookText className="h-4 w-4 mr-2"/> Explain Answer</>}</Button>)}
                </AlertDescription>
            </Alert>
        }
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
            {mode === 'practice' && !isAnswered && <Button variant="outline" onClick={handleGetHint} disabled={isPending}>{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Lightbulb className="h-4 w-4 mr-2"/> Get Hint</>}</Button>}
        </div>
        <Button onClick={handleSubmit} disabled={selectedAnswer === null || isAnswered || isPending}>{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (isAnswered ? "Answered" : "Submit Answer")}</Button>
      </CardFooter>
    </Card>
  );
}
