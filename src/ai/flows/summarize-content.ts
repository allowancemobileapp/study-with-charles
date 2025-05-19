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
});

const summarizeContentFlow = ai.defineFlow(
  {
    name: 'summarizeContentFlow',
    inputSchema: SummarizeContentInputSchema,
    outputSchema: SummarizeContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
