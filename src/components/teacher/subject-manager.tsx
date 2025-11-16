'use client';

import React, { useState, useTransition } from 'react';
import { createSubject, deleteSubject } from '@/app/actions/subject-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Loader2 } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
}

interface SubjectManagerProps {
  initialSubjects: Subject[];
}

export function SubjectManager({ initialSubjects }: SubjectManagerProps) {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleCreateSubject = async () => {
    if (newSubjectName.trim() === '') return;

    startTransition(async () => {
      const result = await createSubject(newSubjectName.trim());
      if (result.success && result.subjectId) {
        setSubjects(prev => [...prev, { id: result.subjectId!, name: newSubjectName.trim() }]);
        setNewSubjectName('');
      } else {
        // Handle error display in a real app (e.g., using toasts)
        alert(result.message);
      }
    });
  };

  const handleDeleteSubject = async (subjectId: string) => {
    startTransition(async () => {
      const result = await deleteSubject(subjectId);
      if (result.success) {
        setSubjects(prev => prev.filter(s => s.id !== subjectId));
      } else {
        alert(result.message);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Subjects</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="New Subject Name..."
            value={newSubjectName}
            onChange={(e) => setNewSubjectName(e.target.value)}
            disabled={isPending}
          />
          <Button onClick={handleCreateSubject} disabled={isPending || newSubjectName.trim() === ''}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} <span className="ml-2">Create</span>
          </Button>
        </div>
        <div className="space-y-2 pt-4">
            {subjects.map(subject => (
                <div key={subject.id} className="flex items-center justify-between p-2 border rounded-md">
                    <span>{subject.name}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteSubject(subject.id)} disabled={isPending}>
                        <Trash2 className="h-4 w-4 text-red-500"/>
                    </Button>
                </div>
            ))}
            {subjects.length === 0 && <p className="text-sm text-muted-foreground text-center">No subjects created yet.</p>}
        </div>
      </CardContent>
    </Card>
  );
}
