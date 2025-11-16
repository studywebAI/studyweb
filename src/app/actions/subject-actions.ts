'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

interface SubjectActionResult {
    success: boolean;
    message: string;
    subjectId?: string;
}

/**
 * Creates a new subject for the currently authenticated user.
 * @param name The name of the new subject.
 * @returns The result of the operation.
 */
export async function createSubject(name: string): Promise<SubjectActionResult> {
    const supabase = createServerActionClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Authentication required.' };
    }

    if (!name || name.trim().length < 2) {
        return { success: false, message: 'Subject name must be at least 2 characters long.' };
    }

    const { data, error } = await supabase
        .from('subjects')
        .insert([{ name: name.trim(), owner_user_id: user.id }])
        .select('id')
        .single();

    if (error) {
        return { success: false, message: `Failed to create subject: ${error.message}` };
    }

    revalidatePath('/teacher/dashboard'); // Revalidate the dashboard to show the new subject
    return { success: true, message: `Subject '${name}' created.`, subjectId: data.id };
}

/**
 * Deletes a subject and its associated questions.
 * @param subjectId The ID of the subject to delete.
 * @returns The result of the operation.
 */
export async function deleteSubject(subjectId: string): Promise<SubjectActionResult> {
    const supabase = createServerActionClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Authentication required.' };
    }

    // First, verify the user owns the subject
    const { data: subjectData, error: ownerError } = await supabase
        .from('subjects')
        .select('owner_user_id')
        .eq('id', subjectId)
        .single();

    if (ownerError || !subjectData) {
        return { success: false, message: 'Subject not found.' };
    }

    if (subjectData.owner_user_id !== user.id) {
        return { success: false, message: 'You are not authorized to delete this subject.' };
    }
    
    // First, delete all questions associated with the subject
    const { error: questionsError } = await supabase
        .from('questions')
        .delete()
        .eq('subject_id', subjectId);
    
    if (questionsError) {
         return { success: false, message: `Failed to delete questions for subject: ${questionsError.message}` };
    }

    // Then delete the subject itself
    const { error } = await supabase.from('subjects').delete().eq('id', subjectId);

    if (error) {
        return { success: false, message: `Failed to delete subject: ${error.message}` };
    }

    revalidatePath('/teacher/dashboard'); // Revalidate the dashboard
    return { success: true, message: 'Subject deleted successfully.' };
}


/**
 * Updates the name of a subject.
 * @param subjectId The ID of the subject to update.
 * @param newName The new name for the subject.
 * @returns The result of the operation.
 */
export async function updateSubject(subjectId: string, newName: string): Promise<SubjectActionResult> {
    const supabase = createServerActionClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: 'Authentication required.' };
    }
    
    if (!newName || newName.trim().length < 2) {
        return { success: false, message: 'Subject name must be at least 2 characters long.' };
    }

    // Verify user owns the subject
    const { data: subjectData, error: ownerError } = await supabase
        .from('subjects')
        .select('owner_user_id')
        .eq('id', subjectId)
        .single();

    if (ownerError || !subjectData) {
        return { success: false, message: 'Subject not found.' };
    }

    if (subjectData.owner_user_id !== user.id) {
        return { success: false, message: 'You are not authorized to edit this subject.' };
    }

    const { error } = await supabase
        .from('subjects')
        .update({ name: newName.trim() })
        .eq('id', subjectId);

    if (error) {
        return { success: false, message: `Failed to update subject: ${error.message}` };
    }

    revalidatePath('/teacher/dashboard');
    return { success: true, message: 'Subject updated successfully.' };
}
