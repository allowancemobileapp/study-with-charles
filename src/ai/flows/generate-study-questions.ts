'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating study questions from uploaded textbook chapters.
 *
 * - generateStudyQuestions - A function that takes textbook content and generates study questions.
 * - GenerateStudyQuestionsInput - The input type for the generateStudyQuestions function.
 * - GenerateStudyQuestionsOutput - The return type for the generateStudyQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStudyQuestionsInputSchema = z.object({
  chapterText: z
    .string()
    .describe('The text content of the textbook chapter.'),
  subjectTitle: z.string().describe('The title of the course or subject.'),
});
export type GenerateStudyQuestionsInput = z.infer<
  typeof GenerateStudyQuestionsInputSchema
>;

const GenerateStudyQuestionsOutputSchema = z.object({
  studyQuestions: z
    .string()
    .describe('A list of potential study questions based on the chapter text.'),
});
export type GenerateStudyQuestionsOutput = z.infer<
  typeof GenerateStudyQuestionsOutputSchema
>;

export async function generateStudyQuestions(
  input: GenerateStudyQuestionsInput
): Promise<GenerateStudyQuestionsOutput> {
  return generateStudyQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStudyQuestionsPrompt',
  input: {schema: GenerateStudyQuestionsInputSchema},
  output: {schema: GenerateStudyQuestionsOutputSchema},
  prompt: `You are an AI study assistant. Your task is to generate study questions based on the content of a textbook chapter.

  Subject Title: {{{subjectTitle}}}
  Chapter Text:
  {{#if chapterText}}
  {{{chapterText}}}
  {{else}}
  No chapter text provided.
  {{/if}}
  
  Generate a list of potential study questions that would help a student prepare for an exam on this material.
  The study questions should be diverse, covering key concepts, definitions, and applications discussed in the chapter.
  The study questions should be in markdown format.
  `,
});

const generateStudyQuestionsFlow = ai.defineFlow(
  {
    name: 'generateStudyQuestionsFlow',
    inputSchema: GenerateStudyQuestionsInputSchema,
    outputSchema: GenerateStudyQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
