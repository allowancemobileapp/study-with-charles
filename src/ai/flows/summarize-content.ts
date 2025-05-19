
'use server';
/**
 * @fileOverview Summarizes uploaded content for quick review.
 *
 * - summarizeContent - A function that handles the content summarization process.
 * - SummarizeContentInput - The input type for the summarizeContent function.
 * - SummarizeContentOutput - The return type for the summarizeContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeContentInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "A file's content as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  subjectTitle: z.string().describe('The title of the subject or course.'),
  desiredFormat: z
    .enum(['Text', 'Summary', 'Question Answering'])
    .describe('The desired format of the summarized content.'),
});
export type SummarizeContentInput = z.infer<typeof SummarizeContentInputSchema>;

const SummarizeContentOutputSchema = z.object({
  result: z.string().describe('The summarized content in the desired format.'),
});
export type SummarizeContentOutput = z.infer<typeof SummarizeContentOutputSchema>;

export async function summarizeContent(input: SummarizeContentInput): Promise<SummarizeContentOutput> {
  return summarizeContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeContentPrompt',
  input: {schema: SummarizeContentInputSchema},
  output: {schema: SummarizeContentOutputSchema},
  prompt: `You are an AI assistant helping students review lecture notes.

You will receive a file containing lecture notes, the subject title, and the desired format for the summarized content. Your task is to process the file and provide the summarized content in the requested format.

Subject Title: {{{subjectTitle}}}
File Content: {{media url=fileDataUri}}
Desired Format: {{{desiredFormat}}}

Please provide the summarized content in the desired format.`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
    ],
  },
});

const summarizeContentFlow = ai.defineFlow(
  {
    name: 'summarizeContentFlow',
    inputSchema: SummarizeContentInputSchema,
    outputSchema: SummarizeContentOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output || typeof output.result !== 'string') {
        // Log the problematic output for server-side debugging
        console.error('AI model returned invalid or missing output structure:', output);
        throw new Error('AI model did not return a valid output structure.');
      }
      return output;
    } catch (e) {
      console.error('Error during summarizeContentFlow execution:', e);
      // Ensure a simple Error object is propagated
      if (e instanceof Error) {
        throw new Error(`AI flow failed: ${e.message}`);
      }
      throw new Error('An unknown error occurred in the AI flow.');
    }
  }
);
