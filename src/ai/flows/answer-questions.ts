// src/ai/flows/answer-questions.ts
'use server';

/**
 * @fileOverview An AI agent that answers questions about assignment instructions.
 *
 * - answerQuestions - A function that handles the question answering process.
 * - AnswerQuestionsInput - The input type for the answerQuestions function.
 * - AnswerQuestionsOutput - The return type for the answerQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerQuestionsInputSchema = z.object({
  assignmentInstructions: z
    .string()
    .describe('The assignment instructions, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'),
  question: z.string().describe('The question about the assignment instructions.'),
  courseTitle: z.string().describe('The title of the course or subject.'),
});
export type AnswerQuestionsInput = z.infer<typeof AnswerQuestionsInputSchema>;

const AnswerQuestionsOutputSchema = z.object({
  answer: z.string().describe('The answer to the question about the assignment instructions.'),
});
export type AnswerQuestionsOutput = z.infer<typeof AnswerQuestionsOutputSchema>;

export async function answerQuestions(input: AnswerQuestionsInput): Promise<AnswerQuestionsOutput> {
  return answerQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerQuestionsPrompt',
  input: {schema: AnswerQuestionsInputSchema},
  output: {schema: AnswerQuestionsOutputSchema},
  prompt: `You are an expert teaching assistant. You are helping a student understand their assignment instructions for the course "{{courseTitle}}".

Assignment Instructions:
{{media url=assignmentInstructions}}

Question: {{{question}}}

Answer:`,
});

const answerQuestionsFlow = ai.defineFlow(
  {
    name: 'answerQuestionsFlow',
    inputSchema: AnswerQuestionsInputSchema,
    outputSchema: AnswerQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
