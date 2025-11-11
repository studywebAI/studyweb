'use server';

/**
 * @fileOverview Implements the search and import summary flow.
 *
 * This flow allows users to search for existing summaries using keywords and import them into other tools, facilitating content reuse.
 *
 * @fileOverview
 * - searchAndImportSummary - A function that handles the search and import process.
 * - SearchAndImportSummaryInput - The input type for the searchAndImportSummary function.
 * - SearchAndImportSummaryOutput - The return type for the searchAndImportSummary function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const SearchAndImportSummaryInputSchema = z.object({
  query: z.string().describe('The search query to find existing summaries.'),
  typeFilter: z.array(z.string()).optional().describe('Optional filter to limit search to specific types (e.g., summary, quiz).'),
  limit: z.number().default(5).describe('The maximum number of search results to return.'),
  sourceItemId: z.string().optional().describe('ID of item to import.'),
  targetTool: z.string().optional().describe('Tool to import item into (e.g., quiz, flashcards).'),
  options: z.record(z.any()).optional().describe('Additional options for importing into the target tool.'),
});
export type SearchAndImportSummaryInput = z.infer<typeof SearchAndImportSummaryInputSchema>;

const SearchAndImportSummaryOutputSchema = z.object({
  matches: z.array(
    z.object({
      item_id: z.string(),
      title: z.string(),
      type: z.string(),
      description: z.string(),
      similarity: z.number(),
      snippet: z.string().optional(),
    })
  ).describe('The search results, including item metadata and similarity scores.'),
  newItemId: z.string().optional().describe('The ID of the newly created item after import, if applicable.'),
  newItemMeta: z.record(z.any()).optional().describe('The meta data of the newly created item after import, if applicable.'),
  progress: z.string().optional().describe('Progress information during the import process.'),
});
export type SearchAndImportSummaryOutput = z.infer<typeof SearchAndImportSummaryOutputSchema>;

export async function searchAndImportSummary(input: SearchAndImportSummaryInput): Promise<SearchAndImportSummaryOutput> {
  return searchAndImportSummaryFlow(input);
}

const searchItems = ai.defineTool({
  name: 'searchItems',
  description: 'Search user items based on a query and optional type filters.',
  inputSchema: z.object({
    query: z.string().describe('The search query.'),
    typeFilter: z.array(z.string()).optional().describe('Optional filters for item types.'),
    limit: z.number().default(5).describe('Maximum number of results to return.'),
  }),
  outputSchema: z.array(
    z.object({
      item_id: z.string(),
      title: z.string(),
      type: z.string(),
      description: z.string(),
      similarity: z.number(),
      snippet: z.string().optional(),
    })
  ),
  async handler(input) {
    const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/items/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      console.error('Search API error:', response.status, await response.text());
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();
    return data.matches || [];
  },
});

const importItem = ai.defineTool({
  name: 'importItem',
  description: 'Imports an item into a specified tool, like creating a quiz from a summary.',
  inputSchema: z.object({
    sourceItemId: z.string().describe('The ID of the item to import.'),
    targetTool: z.string().describe('The tool to import the item into (e.g., quiz, flashcards).'),
    options: z.record(z.any()).optional().describe('Additional options for the import process.'),
  }),
  outputSchema: z.object({
    newItemId: z.string(),
    newItemMeta: z.record(z.any()).optional(),
  }),
  async handler(input) {
    const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/items/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      console.error('Import API error:', response.status, await response.text());
      throw new Error(`Import failed: ${response.status}`);
    }

    const data = await response.json();
    return {newItemId: data.new_item_id, newItemMeta: data.new_item_meta};
  },
});

const searchAndImportPrompt = ai.definePrompt({
  name: 'searchAndImportPrompt',
  input: {
    schema: SearchAndImportSummaryInputSchema,
  },
  model: googleAI.model('gemini-pro'),
  tools: [searchItems, importItem],
  prompt: `You are a helpful assistant that helps users search for and import existing content.

  The user may want to search for content, import content or both.

  If the user provides a "query" then use the "searchItems" tool to find relevant content.
  If the user provides "sourceItemId" and "targetTool" then use the "importItem" tool to import the content into the specified tool.

  Return the "matches" from the searchItems tool and the "newItemId" from the importItem tool.  If importItem is used, include the "newItemMeta" as well.

  Consider these safety settings:
  BLOCK_NONE for HARM_CATEGORY_DANGEROUS_CONTENT
  BLOCK_ONLY_HIGH for HARM_CATEGORY_HATE_SPEECH,
  BLOCK_MEDIUM_AND_ABOVE for HARM_CATEGORY_HARASSMENT and HARM_CATEGORY_SEXUALLY_EXPLICIT.

  Always respond in JSON format.
`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  },
});

const searchAndImportSummaryFlow = ai.defineFlow(
  {
    name: 'searchAndImportSummaryFlow',
    inputSchema: SearchAndImportSummaryInputSchema,
    outputSchema: SearchAndImportSummaryOutputSchema,
  },
  async input => {
    const {output} = await searchAndImportPrompt(input);
    return output!;
  }
);
