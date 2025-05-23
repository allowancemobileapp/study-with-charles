
'use server';
/**
 * @fileOverview Handles follow-up questions based on previous AI-generated context.
 *
 * - answerFollowUp - A function that takes previous context and a new query.
 * - AnswerFollowUpInput - The input type for the answerFollowUp function.
 * - AnswerFollowUpOutput - The return type for the answerFollowUp function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerFollowUpInputSchema = z.object({
  previousResultText: z
    .string()
    .min(1)
    .describe('The text of the previous AI response that provides context.'),
  followUpQuery: z
    .string()
    .min(1)
    .describe('The user\'s follow-up question related to the previous context.'),
  subjectTitle: z.string().min(1).describe('The original subject or course title for context.'),
  desiredFormat: z
    .enum(['Text', 'Summary', 'Question Answering', 'Explain'])
    .describe('The original desired format, to guide the style of the follow-up answer.'),
});
export type AnswerFollowUpInput = z.infer<typeof AnswerFollowUpInputSchema>;

const AnswerFollowUpOutputSchema = z.object({
  followUpAnswer: z.string().describe('The AI\'s answer to the follow-up question.'),
});
export type AnswerFollowUpOutput = z.infer<typeof AnswerFollowUpOutputSchema>;

export async function answerFollowUp(input: AnswerFollowUpInput): Promise<AnswerFollowUpOutput> {
  return answerFollowUpFlow(input);
}

const answerFollowUpFlow = ai.defineFlow(
  {
    name: 'answerFollowUpFlow',
    inputSchema: AnswerFollowUpInputSchema,
    outputSchema: AnswerFollowUpOutputSchema,
  },
  async (input) => {
    console.log("AI Flow: answerFollowUpFlow - Initiated with input:", {
        subjectTitle: input.subjectTitle,
        desiredFormat: input.desiredFormat,
        followUpQueryLength: input.followUpQuery.length,
        previousResultTextLength: input.previousResultText.length,
    });

    const promptMessages: ({text: string} | {media: {url: string}})[] = []; // Use a more general type

    promptMessages.push({ text: `You are an AI assistant helping a student with the subject: "${input.subjectTitle}".` });
    promptMessages.push({ text: `The student previously received this information from you or another AI:\n\nPREVIOUS CONTEXT:\n${input.previousResultText}\n\nEND OF PREVIOUS CONTEXT.` });
    promptMessages.push({ text: `Now, the student has a follow-up question: "${input.followUpQuery}"` });
    
    let mainInstruction = "";
    if (input.desiredFormat === 'Question Answering') {
        mainInstruction = `Based on the PREVIOUS CONTEXT and the student's FOLLOW-UP QUESTION, provide a concise answer to the follow-up question. If the follow-up asks for more questions, generate 1-2 new, distinct questions and their answers related to both the context and the follow-up. The entire output for this task, if generating new Q&A, MUST be a single, valid JSON string representing an array of objects, each with "Question" and "Answer" string properties. Example: [{"Question": "Q1?", "Answer": "A1."}]. If simply answering the follow-up, provide a direct textual answer.`;
    } else { // For Text, Summary, Explain
        mainInstruction = `Based on the PREVIOUS CONTEXT and the student's FOLLOW-UP QUESTION, provide a comprehensive textual answer to the follow-up question. Maintain a style consistent with explaining or summarizing, depending on the original query's nature.`;
    }
    promptMessages.push({ text: `\nTask Instructions for Follow-up:\n${mainInstruction}` });

    console.log("AI Flow: answerFollowUpFlow - Final prompt messages preview (text parts):", JSON.stringify(promptMessages, null, 2));
    
    try {
      console.log("AI Flow: answerFollowUpFlow - Calling ai.generate with model 'googleai/gemini-1.5-flash-latest'.");
      
      const response = await ai.generate({
        prompt: promptMessages, // Genkit handles this type
        model: 'googleai/gemini-1.5-flash-latest',
        output: { schema: AnswerFollowUpOutputSchema }, 
        config: {
          safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        },
      });

      const output = response.output; 

      if (!output || typeof output.followUpAnswer !== 'string') {
        const receivedOutputDetails = output ? JSON.stringify(output, null, 2) : 'null or undefined output field';
        console.error('AI Flow: answerFollowUpFlow - AI model returned invalid or missing output structure. Output.followUpAnswer was not a string. Output received:', receivedOutputDetails);
        throw new Error('AI model did not return a valid follow-up answer. Expected a JSON object with a "followUpAnswer" string field.');
      }
      console.log("AI Flow: answerFollowUpFlow - Successfully received and parsed output. Answer length:", output.followUpAnswer.length);
      return output;

    } catch (e: unknown) {
      let errorMessage = 'AI flow failed during follow-up processing.';
      if (e instanceof Error) {
        console.error('CRITICAL ERROR in AI Flow (answerFollowUpFlow):', e.name, e.message, e.stack, e.cause);
        errorMessage = `AI follow-up failed: ${e.message}`;
      } else {
        console.error('CRITICAL ERROR in AI Flow (answerFollowUpFlow): Unknown error type caught:', e);
      }
      throw new Error(errorMessage);
    }
  }
);
