'use client';

import React, { useState, useTransition, useRef } from 'react';
import { createSubject, deleteSubject, updateSubject } from '@/app/actions/subject-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Trash2, Plus, Loader2, Edit, Save, X, Bot } from 'lucide-react';
import { QuestionManager } from './question-manager';
import type { Subject, Question } from '@/types/database';
import { CsvUploader } from './csv-uploader';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { FileQuestion } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AiQuestionGenerator } from './ai-question-generator';

type SubjectWithQuestions = Subject & { questions: Question[] };

interface SubjectManagerProps {
  initialSubjects: SubjectWithQuestions[];
}

export function SubjectManager({ initialSubjects }: SubjectManagerProps) {
  const [subjects, setSubjects] = useState<SubjectWithQuestions[]>(initialSubjects);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingSubjectName, setEditingSubjectName] = useState('');
  const [isPending, startTransition] = useTransition();
  const newSubjectInputRef = useRef<HTMLInputElement>(null);

  const handleCreateSubject = async () => {
    if (newSubjectName.trim() === '') return;

    startTransition(async () => {
      const result = await createSubject(newSubjectName.trim());
      if (result.success && result.subjectId) {
        const newSubject: SubjectWithQuestions = {
            id: result.subjectId!,
            name: newSubjectName.trim(),
            questions: [],
            owner_user_id: '', // This will be set by the server, but we need it for the type
            created_at: new Date().toISOString()
        };
        setSubjects(prev => [newSubject, ...prev]);
        setNewSubjectName('');
        newSubjectInputRef.current?.focus();
      } else {
        alert(result.message);
      }
    });
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm('Are you sure you want to delete this subject and all its questions?')) return;
    
    startTransition(async () => {
      const result = await deleteSubject(subjectId);
      if (result.success) {
        setSubjects(prev => prev.filter(s => s.id !== subjectId));
      } else {
        alert(result.message);
      }
    });
  };

  const handleStartEdit = (subject: SubjectWithQuestions) => {
    setEditingSubjectId(subject.id);
    setEditingSubjectName(subject.name);
  };

  const handleCancelEdit = () => {
    setEditingSubjectId(null);
    setEditingSubjectName('');
  };

  const handleUpdateSubject = async (subjectId: string) => {
    if (editingSubjectName.trim() === '') return;
    
    startTransition(async () => {
      const result = await updateSubject(subjectId, editingSubjectName.trim());
      if (result.success) {
        setSubjects(prev => prev.map(s => s.id === subjectId ? { ...s, name: editingSubjectName.trim() } : s));
        handleCancelEdit();
      } else {
        alert(result.message);
      }
    });
  }

  // Callback to refresh questions for a subject after AI generation
  const onAiQuestionsGenerated = (subjectId: string, newQuestions: Question[]) => {
      setSubjects(prevSubjects =>
          prevSubjects.map(subject =>
              subject.id === subjectId
                  ? { ...subject, questions: [...newQuestions, ...subject.questions] }
                  : subject
          )
      );
  };


  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Create New Subject</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2">
                    <Input
                        ref={newSubjectInputRef}
                        placeholder="e.g., Biology Chapter 4: Cells"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        disabled={isPending}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateSubject()}
                    />
                    <Button onClick={handleCreateSubject} disabled={isPending || newSubjectName.trim() === ''}>
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> <span className="hidden sm:inline ml-2">Create</span></>}
                    </Button>
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Your Subjects</CardTitle>
            </CardHeader>
            <CardContent>
                {subjects.length === 0 ? (
                    <Alert>
                        <FileQuestion className="h-4 w-4" />
                        <AlertTitle>No Subjects Found</AlertTitle>
                        <AlertDescription>
                            Create a subject above to start adding questions.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Accordion type="single" collapsible className="w-full">
                        {subjects.map(subject => (
                            <AccordionItem value={subject.id} key={subject.id}>
                                <AccordionTrigger disabled={isPending}>
                                    {editingSubjectId === subject.id ? (
                                        <div className="flex w-full items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            <Input
                                                value={editingSubjectName}
                                                onChange={(e) => setEditingSubjectName(e.target.value)}
                                                className="h-8"
                                                autoFocus
                                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateSubject(subject.id)}
                                            />
                                            <Button size="icon" className="h-8 w-8" onClick={() => handleUpdateSubject(subject.id)} disabled={isPending}><Save className="h-4 w-4"/></Button>
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEdit} disabled={isPending}><X className="h-4 w-4"/></Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between w-full pr-4">
                                            <span className="font-semibold">{subject.name}</span>
                                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" onClick={() => handleStartEdit(subject)} disabled={isPending}><Edit className="h-4 w-4"/></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteSubject(subject.id)} disabled={isPending}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                                            </div>
                                        </div>
                                    )}
                                </AccordionTrigger>
                                <AccordionContent>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-6">
                                        <QuestionManager subjectId={subject.id} initialQuestions={subject.questions} />
                                        
                                        <Tabs defaultValue="ai_generator">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="ai_generator"><Bot className="w-4 h-4 mr-2" /> AI Generator</TabsTrigger>
                                                <TabsTrigger value="csv_upload"><FileQuestion className="w-4 h-4 mr-2" /> CSV Upload</TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="ai_generator">
                                                <AiQuestionGenerator subject={subject} onGenerationComplete={(newQuestions) => onAiQuestionsGenerated(subject.id, newQuestions)} />
                                            </TabsContent>
                                            <TabsContent value="csv_upload">
                                                <CsvUploader subjectId={subject.id} />
                                            </TabsContent>
                                        </Tabs>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
