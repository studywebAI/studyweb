'use server';

/**
 * @fileOverview This file is being temporarily repurposed.
 * The Genkit tools and flows are being bypassed to use direct API calls.
 * This functionality will be restored in a future update.
 */

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

// This function is temporarily disabled and will return an empty result.
export async function searchAndImportSummary(input: SearchAndImportSummaryInput): Promise<SearchAndImportSummaryOutput> {
  console.warn("searchAndImportSummary is temporarily disabled.");
  
  const output: SearchAndImportSummaryOutput = {
    matches: []
  };

  if (input.query) {
     try {
        const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/items/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query: input.query,
            typeFilter: input.typeFilter,
            limit: input.limit
        }),
        });
        if (response.ok) {
            const data = await response.json();
            output.matches = data.matches || [];
        }
     } catch (e) {
        console.error("Search failed", e);
     }
  }

  if (input.sourceItemId && input.targetTool) {
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/items/import', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sourceItemId: input.sourceItemId,
                targetTool: input.targetTool,
                options: input.options,
            }),
        });
         if (response.ok) {
            const data = await response.json();
            output.newItemId = data.new_item_id;
            output.newItemMeta = data.new_item_meta;
        }
      } catch(e) {
        console.error("Import failed", e);
      }
  }


  return output;
}
