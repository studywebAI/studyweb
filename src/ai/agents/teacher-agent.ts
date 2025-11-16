import { BaseAgent } from './base-agent';
import { ContentAgent } from './content-agent';
import { DifficultyAgent } from './difficulty-agent';
import { createAgent } from './factory';
import type { Question } from '@/types/database';

interface QuizCreationJob {
  topic: string;
  numberOfQuestions: number;
  studentLevel: string; // e.g., 'high_school', 'university'
}

/**
 * Agent responsible for assisting teachers.
 * This agent orchestrates other agents to perform complex tasks like creating a full quiz.
 */
export class TeacherAgent extends BaseAgent {
    /**
     * Creates a full, ready-to-use quiz from a simple topic.
     * This method orchestrates ContentAgent and DifficultyAgent.
     * @param job - The quiz creation job details.
     * @returns A new question set.
     */
    async run(job: QuizCreationJob): Promise<Omit<Question, 'id' | 'created_at' | 'subject_id' | 'author_id'>[]> {
        console.log(`[TeacherAgent] Starting quiz creation job for topic: "${job.topic}" with ${this.model.modelName}`);

        // 1. Create a ContentAgent to generate the questions.
        const contentAgent = createAgent('content', this.model) as ContentAgent;
        const generatedQuestions = await contentAgent.run(job.topic, job.numberOfQuestions);

        // 2. Create a DifficultyAgent to refine the difficulty of each question.
        const difficultyAgent = createAgent('difficulty') as DifficultyAgent;

        const refinedQuestions = await Promise.all(
            generatedQuestions.map(async (q: any) => {
                const difficulty = await difficultyAgent.run(q);
                return {
                    ...q,
                    difficulty: difficulty,
                };
            })
        );
        
        console.log(`[TeacherAgent] Successfully generated and refined ${refinedQuestions.length} questions.`);
        return refinedQuestions;
    }
}
