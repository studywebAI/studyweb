'use client';

import { useState, useTransition } from 'react';
import { generateQuestionsWithAi } from '@/app/actions/teacher-actions';
import type { Subject, Question } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Wand2, CheckCircle, AlertTriangle } from 'lucide-react';
import { getQuestionsForSubject } from '@/app/actions/teacher-actions';

interface AiQuestionGeneratorProps {
  subject: Subject;
  onGenerationComplete: (newQuestions: Question[]) => void;
}

export function AiQuestionGenerator({ subject, onGenerationComplete }: AiQuestionGeneratorProps) {
  const [topic, setTopic] = useState(subject.name);
  const [questionCount, setQuestionCount] = useState(10);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string; } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    startTransition(async () => {
      const generationResult = await generateQuestionsWithAi(subject.id, { topic, questionCount });
      setResult(generationResult);
      if (generationResult.success) {
          // Refetch questions for the subject to update the list
          const questionsResult = await getQuestionsForSubject(subject.id);
          if (questionsResult.success) {
              onGenerationComplete(questionsResult.questions);
          }
      }
    });
  };

  return (
    <Card className="bg-transparent border-0 shadow-none">
      <CardHeader className="px-1">
        <CardTitle>AI Question Generator</CardTitle>
        <CardDescription>Generate a new set of questions for this subject using AI.</CardDescription>
      </CardHeader>
      <CardContent className="px-1">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., The French Revolution"
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="question-count">Number of Questions</Label>
            <Select
              value={String(questionCount)}
              onValueChange={(value) => setQuestionCount(Number(value))}
              disabled={isPending}
            >
              <SelectTrigger id="question-count">
                <SelectValue placeholder="Select number of questions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 Questions</SelectItem>
                <SelectItem value="10">10 Questions</SelectItem>
                <SelectItem value="15">15 Questions</SelectItem>
                <SelectItem value="20">20 Questions</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={isPending || !topic}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Generate Questions
          </Button>
        </form>

        {result && (
            <Alert className="mt-4" variant={result.success ? 'default' : 'destructive'}>
                {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <AlertTitle>{result.success ? 'Generation Complete' : 'Generation Failed'}</AlertTitle>
                <AlertDescription>{result.message}</AlertDescription>
            </Alert>
        )}
      </CardContent>
    </Card>
  );
}
