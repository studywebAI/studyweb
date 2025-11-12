import {z} from 'zod';

const ApiKeySchema = z.object({
  provider: z.enum(['openai', 'google']),
  key: z.string(),
})
export type ApiKey = z.infer<typeof ApiKeySchema>;

export const GenerateAnswerFromTextInputSchema = z.object({
  text: z.string().describe('The question to answer.'),
  model: z.string().describe('The AI model to use for generation.'),
  apiKey: ApiKeySchema.optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'ai']),
        content: z.string(),
      })
    )
    .optional()
    .describe('The conversation history.'),
});

export const GenerateAnswerFromTextOutputSchema = z.object({
  answer: z.string().describe('The answer to the question.'),
});


export const GenerateFlashcardsFromTextInputSchema = z.object({
  text: z.string().describe('The text to generate flashcards from.'),
  model: z.string().describe('The AI model to use for generation.'),
  apiKey: ApiKeySchema.optional(),
});

export const GenerateFlashcardsFromTextOutputSchema = z.object({
  cards: z
    .array(
      z.object({
        front: z
          .string()
          .describe('The term or concept on the front of the flashcard.'),
        back: z
          .string()
          .describe(
            'The definition or explanation on the back of the flashcard.'
          ),
        explanation: z
          .string()
          .describe('Additional context or explanation.'),
      })
    )
    .describe('The generated flashcards.'),
});


export const GenerateQuizFromSummaryInputSchema = z.object({
  summaryContent: z
    .string()
    .describe('The content of the summary to generate a quiz from.'),
  model: z.string().describe('The AI model to use for generation.'),
  apiKey: ApiKeySchema.optional(),
  options: z
    .object({
      questionCount: z
        .number()
        .describe('The number of questions to generate for the quiz.'),
      difficulty: z
        .string()
        .optional()
        .describe('The difficulty level of the quiz questions.'),
    })
    .optional(),
});

const QuizQuestionSchema = z.object({
  question: z.string().describe('The quiz question (can be fill-in-the-blank or short answer).'),
  correctAnswer: z.string().describe('The ideal correct answer.'),
  explanation: z
    .string()
    .describe('The explanation for why the answer is correct.'),
});

export const GenerateQuizFromSummaryOutputSchema = z.object({
  questions: z
    .array(QuizQuestionSchema)
    .describe('The generated quiz questions.'),
});

export const GenerateSummaryFromTextInputSchema = z.object({
  text: z.string().describe('The text to summarize.'),
  model: z.string().describe('The AI model to use for generation.'),
  apiKey: ApiKeySchema.optional(),
});

export const GenerateSummaryFromTextOutputSchema = z.object({
  summary: z.string().describe('The generated summary.'),
});


export const ImportContentForQuizGenerationInputSchema = z.object({
  content: z.string().describe('The content to be used for quiz generation.'),
  model: z.string().describe('The AI model to use for generation.'),
  apiKey: ApiKeySchema.optional(),
  options: z
    .object({
      question_count: z.number().describe('The number of questions to generate.'),
      difficulty: z.string().describe('The difficulty level of the quiz.'),
    })
    .optional(),
});

export const ImportContentForQuizGenerationOutputSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe('The quiz question.'),
      options: z.array(z.string()).describe('The possible answers.'),
      correctIndex: z.number().describe('The index of the correct answer.'),
      explanation: z.string().describe('Explanation of the correct answer.'),
    })
  ),
});
