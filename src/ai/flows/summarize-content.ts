
'use server';
/**
 * @fileOverview Summarizes uploaded content or extracts text based on desired format.
 *
 * - summarizeContent - A function that handles the content processing.
 * - SummarizeContentInput - The input type for the summarizeContent function.
 * - SummarizeContentOutput - The return type for the summarizeContent function.
 */

import {ai} from '@/ai/genkit';
import type { PromptData } from 'genkit';
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
  result: z.string().describe('The processed content in the desired format.'),
});
export type SummarizeContentOutput = z.infer<typeof SummarizeContentOutputSchema>;

export async function summarizeContent(input: SummarizeContentInput): Promise<SummarizeContentOutput> {
  return summarizeContentFlow(input);
}

const summarizeContentFlow = ai.defineFlow(
  {
    name: 'summarizeContentFlow',
    inputSchema: SummarizeContentInputSchema,
    outputSchema: SummarizeContentOutputSchema,
  },
  async (input) => {
    const introText = `You are an AI assistant helping students review lecture notes and documents for the course: "${input.subjectTitle}".
You will receive a file (provided as media content) and the desired format for the result.
Your task is to process the file and provide the result in the requested format.
Desired Output Format: ${input.desiredFormat}
`;

    let taskInstruction = "";
    if (input.desiredFormat === 'Text') {
      taskInstruction = 'Based on the file provided, extract and provide all relevant textual content to help answer potential assignment questions or research tasks. If the file is an image, describe the image in detail or extract any visible text. The result should be comprehensive text or a detailed description. This tool is intended to help with assignments requiring research by extracting relevant text from documents.';
    } else if (input.desiredFormat === 'Summary') {
      taskInstruction = 'Based on the file provided, provide a concise and comprehensive summary of its key content, concepts, and main points.';
    } else if (input.desiredFormat === 'Question Answering') {
      taskInstruction = `Based on the file provided, generate a series of questions that cover the key information, concepts, and themes within the document. For each question, provide a clear and concise answer directly underneath it. Format each question and answer pair as follows:

Question: [Your generated question here]
Answer: [Your generated answer here]

Ensure the questions are relevant for someone studying for an exam on this material.`;
    } else {
      // Fallback for any unexpected format, though schema validation should prevent this.
      taskInstruction = `Process the content and provide it in the specified format: ${input.desiredFormat}.`;
    }

    const promptMessages: ({text: string} | {media: {url: string}})[] = [
      {text: introText},
      {text: "File Content (appears after this line):"},
      {media: {url: input.fileDataUri}},
      {text: "\nTask Instructions:\n" + taskInstruction},
    ];
    
    try {
      console.log("AI Flow: summarizeContentFlow - Calling ai.generate with model 'googleai/gemini-1.5-flash-latest'");
      const response = await ai.generate({
        prompt: promptMessages as PromptData[],
        model: 'googleai/gemini-1.5-flash-latest', 
        output: { schema: SummarizeContentOutputSchema }, 
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

      if (!output || typeof output.result !== 'string') {
        const receivedOutput = output ? JSON.stringify(output, null, 2) : 'null';
        console.error('AI model returned invalid or missing output structure. Output received:', receivedOutput);
        throw new Error('AI model did not return a valid output structure. Expected a JSON object with a "result" string field.');
      }
      console.log("AI Flow: summarizeContentFlow - Successfully received and parsed output.");
      return output;
    } catch (e: unknown) { 
      console.error('CRITICAL ERROR in AI Flow (summarizeContentFlow):', e);
      if (e instanceof Error) {
        throw new Error(`AI flow failed: ${e.message}`);
      }
      throw new Error('An unknown error occurred in the AI flow processing.');
    }
  }
);
