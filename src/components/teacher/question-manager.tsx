'use client';

import React, { useState } from 'react';
import type { Question } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


interface QuestionManagerProps {
  subjectId: string;
  initialQuestions: Question[];
}

export function QuestionManager({ subjectId, initialQuestions }: QuestionManagerProps) {
  const [questions, setQuestions] = useState(initialQuestions);

  const handleAddQuestion = () => {
    // TODO: Implement a modal or form to add a new question
    console.log('Adding new question for subject:', subjectId);
  };
  
  return (
    <div className="space-y-4">
        <div>
            <h4 className="font-semibold mb-2 text-base">Questions ({questions.length})</h4>
             <Button onClick={handleAddQuestion} size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Add Question Manually
            </Button>
        </div>
      
      {questions.length > 0 ? (
        <Card>
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {questions.map(q => (
                        <TableRow key={q.id}>
                            <TableCell className="font-medium max-w-sm truncate">{q.question_text}</TableCell>
                            <TableCell>{q.type}</TableCell>
                            <TableCell>{q.difficulty}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm">Edit</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground mt-4 text-center py-4">No questions have been added to this subject yet.</p>
      )}
    </div>
  );
}
