'use client';

import React, { useState, useRef } from 'react';
import { handleCsvUpload } from '@/app/actions/teacher-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Upload, CheckCircle, AlertTriangle } from 'lucide-react';

interface CsvUploaderProps {
  subjectId: string; // The uploader needs to know which subject to associate the questions with.
  onUploadComplete?: (count: number) => void;
}

export function CsvUploader({ subjectId, onUploadComplete }: CsvUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; errors?: any[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setResult({ success: false, message: 'Please select a CSV file to upload.' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvContent = e.target?.result as string;
      const uploadResult = await handleCsvUpload(csvContent, subjectId);
      setResult(uploadResult);
      setIsLoading(false);
      if (uploadResult.success && onUploadComplete && uploadResult.insertedCount) {
        onUploadComplete(uploadResult.insertedCount);
      }
    };
    reader.onerror = () => {
      setResult({ success: false, message: 'Failed to read the file.' });
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full max-w-md p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Upload Questions via CSV</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="csv-file">CSV File</Label>
                <Input 
                    id="csv-file" 
                    type="file" 
                    accept=".csv" 
                    onChange={handleFileChange} 
                    ref={fileInputRef} 
                    disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">Must have headers: question_text, type, difficulty, answers, correct_answer, explanation</p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !file}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Upload Questions
            </Button>
        </form>

        {result && (
            <Alert className="mt-4" variant={result.success ? 'default' : 'destructive'}>
                {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <AlertTitle>{result.success ? 'Upload Successful' : 'Upload Failed'}</AlertTitle>
                <AlertDescription>
                    {result.message}
                    {result.errors && (
                        <ul className="mt-2 list-disc list-inside text-xs">
                            {result.errors.map((err, index) => (
                                <li key={index}>Row {err.row}: {JSON.stringify(err.errors)}</li>
                            ))}
                        </ul>
                    )}
                </AlertDescription>
            </Alert>
        )}
    </div>
  );
}
