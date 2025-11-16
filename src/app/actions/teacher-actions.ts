'use server';

import { createServerActionClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Papa from 'papaparse';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { Question } from '@/types/database';
import { generateQuestions, type GenerateQuestionsInput } from '@/ai/flows/generate-questions';


// Define the expected structure of a row in the CSV file.
const CsvRowSchema = z.object({
    question_text: z.string().min(5),
    type: z.enum(['multiple_choice', 'open_answer', 'true_false']),
    difficulty: z.preprocess(val => Number(val), z.number().min(0).max(10)),
    // answers and correct_answer will be JSON strings in the CSV
    answers: z.string().optional(), 
    correct_answer: z.string(),
    explanation: z.string().optional()
});

interface CsvUploadResult {
    success: boolean;
    message: string;
    insertedCount?: number;
    errors?: any[];
}

/**
 * Handles the upload of a CSV file containing quiz questions.
 * Parses the file, validates the data, and inserts it into the database.
 *
 * @param csvContent The raw string content of the CSV file.
 * @param subject_id The ID of the subject to associate these questions with.
 * @returns An object indicating the result of the operation.
 */
export async function handleCsvUpload(csvContent: string, subject_id: string): Promise<CsvUploadResult> {
    const supabase = createServerActionClient({ cookies });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, message: "Authentication required." };
    }

    try {
        const parseResult = Papa.parse(csvContent, {
            header: true,
            skipEmptyLines: true,
        });

        if (parseResult.errors.length > 0) {
            return { success: false, message: "Failed to parse CSV file.", errors: parseResult.errors };
        }

        const validationErrors: any[] = [];
        const validatedQuestions = parseResult.data.map((row, index) => {
            const result = CsvRowSchema.safeParse(row);
            if (!result.success) {
                validationErrors.push({ row: index + 2, errors: result.error.flatten() });
                return null;
            }

            try {
                return {
                    subject_id,
                    question_text: result.data.question_text,
                    type: result.data.type,
                    difficulty: result.data.difficulty,
                    answers: result.data.answers ? JSON.parse(result.data.answers) : null,
                    correct_answer: JSON.parse(result.data.correct_answer),
                    metadata: { source: 'csv_upload' },
                    author_id: user.id
                };
            } catch (e) {
                validationErrors.push({ row: index + 2, errors: { json_parsing: "Invalid JSON in answers or correct_answer column." } });
                return null;
            }
        }).filter(q => q !== null);

        if (validationErrors.length > 0) {
            return { success: false, message: "CSV validation failed.", errors: validationErrors };
        }

        if (validatedQuestions.length === 0) {
            return { success: false, message: "No valid questions found in the CSV." };
        }

        const { error } = await supabase.from('questions').insert(validatedQuestions as any);

        if (error) {
            return { success: false, message: `Database error: ${error.message}` };
        }

        revalidatePath('/teacher/dashboard');
        return { success: true, message: `Successfully inserted ${validatedQuestions.length} questions.`, insertedCount: validatedQuestions.length };

    } catch (e: any) {
        return { success: false, message: `An unexpected error occurred: ${e.message}` };
    }
}


interface GetQuestionsResult {
    success: boolean;
    questions: Question[];
    message?: string;
}

export async function getQuestionsForSubject(subjectId: string): Promise<GetQuestionsResult> {
    const supabase = createServerActionClient({ cookies });
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, questions: [], message: 'Authentication required.' };
    }

    // Verify user owns subject
    const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('owner_user_id')
        .eq('id', subjectId)
        .single();
    
    if (subjectError || !subjectData) {
        return { success: false, questions: [], message: 'Subject not found.' };
    }

    if (subjectData.owner_user_id !== user.id) {
        return { success: false, questions: [], message: 'Unauthorized.' };
    }

    const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: false });

    if (error) {
        return { success: false, questions: [], message: error.message };
    }

    return { success: true, questions: data as Question[] };
}

interface GenerateQuestionsResult {
    success: boolean;
    message: string;
    questionCount?: number;
}

export async function generateQuestionsWithAi(subjectId: string, input: GenerateQuestionsInput): Promise<GenerateQuestionsResult> {
     try {
        const { questions } = await generateQuestions(input);
        
        if (!questions || questions.length === 0) {
            return { success: false, message: "The AI failed to generate any questions. Please try again." };
        }

        const addResult = await addQuestionsToSubject(subjectId, questions);
        if (!addResult.success) {
            return addResult;
        }

        return { success: true, message: `Successfully generated and added ${questions.length} questions.`, questionCount: questions.length };
    } catch (e: any) {
        console.error("Error generating questions with AI:", e);
        return { success: false, message: e.message || "An unexpected error occurred during AI question generation." };
    }
}


interface AddQuestionsResult {
    success: boolean;
    message: string;
}
export async function addQuestionsToSubject(subjectId: string, questions: Omit<Question, 'id' | 'created_at' | 'subject_id' | 'author_id'>[]): Promise<AddQuestionsResult> {
    const supabase = createServerActionClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: "Authentication required." };
    }
    
    const questionsToInsert = questions.map(q => ({
        ...q,
        subject_id: subjectId,
        author_id: user.id,
        metadata: { ...q.metadata, source: 'ai_generation' }
    }));

    const { error } = await supabase.from('questions').insert(questionsToInsert);

    if (error) {
        return { success: false, message: `Database Error: ${error.message}` };
    }
    
    revalidatePath('/teacher/dashboard');
    return { success: true, message: 'Questions added.' };
}
