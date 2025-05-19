
'use server';
/**
 * @fileOverview Summarizes uploaded content or text query, or extracts text based on desired format.
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
    ).optional(),
  subjectTitle: z.string().describe('The title of the subject or course.'),
  desiredFormat: z
    .enum(['Text', 'Summary', 'Question Answering'])
    .describe('The desired format of the summarized content.'),
  userTextQuery: z.string().optional().describe('An optional direct text query or question from the user.'),
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
    console.log("AI Flow: summarizeContentFlow - Initiated with input:", { 
      subjectTitle: input.subjectTitle, 
      desiredFormat: input.desiredFormat, 
      fileDataUriLength: input.fileDataUri?.length,
      userTextQueryPresent: !!input.userTextQuery 
    });

    const promptMessages: ({text: string} | {media: {url: string}})[] = [];
    let mainInstruction = "";

    const baseIntro = `You are an AI assistant helping a student. Subject: "${input.subjectTitle}". Desired Output Format: ${input.desiredFormat}.`;
    promptMessages.push({ text: baseIntro });

    if (input.userTextQuery) {
      if (input.fileDataUri) {
        promptMessages.push({ text: `The user has provided a text query AND a file. Use the file as primary context to answer/address the user's text query.\nUser's query: "${input.userTextQuery}"\nFile Content (appears after this line):` });
        promptMessages.push({ media: { url: input.fileDataUri } });
        
        if (input.desiredFormat === 'Text') {
            mainInstruction = `Based on the user's query and the provided file, extract relevant text or solve any assignment questions implied by the query using information from the file. Present the solution as a well-structured document. If the query doesn't seem to be an assignment question, provide a comprehensive textual answer to the query using the file as context.`;
        } else if (input.desiredFormat === 'Summary') {
            mainInstruction = `Based on the user's query and the provided file, generate a concise summary that addresses the query using information from the file.`;
        } else if (input.desiredFormat === 'Question Answering') {
            mainInstruction = `The user has a query: "${input.userTextQuery}". Based on this query AND the provided file, generate 3-5 distinct study questions and their corresponding concise answers relevant to both. The entire output for this task MUST be a single, valid JSON string representing an array of objects, each with "Question" and "Answer" string properties. Example: [{"Question": "Q1 from file related to query?", "Answer": "A1 based on file and query."}] Do NOT include any text, explanations, or markdown formatting outside of this JSON array string.`;
        }
      } else { // Only userTextQuery
        promptMessages.push({ text: `Address the following text query/question from the user: "${input.userTextQuery}"` });
         if (input.desiredFormat === 'Text') {
            mainInstruction = `Provide a comprehensive textual answer or solution to the user's query: "${input.userTextQuery}". If it's an assignment-style question, solve it in a document format.`;
        } else if (input.desiredFormat === 'Summary') {
            mainInstruction = `Generate a concise summary for the user's query: "${input.userTextQuery}".`;
        } else if (input.desiredFormat === 'Question Answering') {
            mainInstruction = `Based on the user's query: "${input.userTextQuery}", generate 3-5 distinct study questions and their corresponding concise answers. The entire output for this task MUST be a single, valid JSON string representing an array of objects, each with "Question" and "Answer" string properties. Example: [{"Question": "Related Q1?", "Answer": "Related A1."}] Do NOT include any text, explanations, or markdown formatting outside of this JSON array string.`;
        }
      }
    } else if (input.fileDataUri) { // Only fileDataUri
      promptMessages.push({ text: `You will receive a file (provided as media content) and the desired format for the result. Your task is to process the file and provide the result in the requested format.\nFile Content (appears after this line):`});
      promptMessages.push({ media: { url: input.fileDataUri } });
      
      if (input.desiredFormat === 'Text') {
        mainInstruction = `You are an AI assistant specializing in solving academic assignments.
Your task is to analyze the provided file content (which could be a document or an image of an assignment).
First, carefully examine the content to identify any specific assignment questions or problems that need to be solved.

If you find explicit questions:
- Answer these questions thoroughly and accurately.
- Present your answers in a well-structured document or report format. This means using clear headings for each question if multiple are found, and providing comprehensive answers.
- Use clear language and provide explanations or steps where appropriate.
- The entire response should be a coherent solution to the identified assignment questions.

If you DO NOT find any specific assignment questions or problems to solve in the content:
- Your entire output MUST be the following exact phrase: "No specific assignment questions were identified in the uploaded content. Please ensure your document contains clear questions if you intended to use the assignment solving feature."

Do not add any conversational preamble or unrelated text to your response.`;
      } else if (input.desiredFormat === 'Summary') {
        mainInstruction = 'Based on the file provided, provide a concise and comprehensive summary of its key content, concepts, and main points. Focus on extracting the core ideas and presenting them clearly.';
      } else if (input.desiredFormat === 'Question Answering') {
        mainInstruction = `You are an AI study assistant. Based on the provided file content, generate 3-5 distinct study questions and their corresponding concise answers.
The entire output for this task MUST be a single, valid JSON string.
This JSON string must represent an array of JavaScript objects.
Each object in the array MUST have exactly two string properties: "Question" and "Answer".
The value for "Question" should be the generated study question.
The value for "Answer" should be the concise answer to that question.

Example of the required JSON output format:
[{"Question": "What is the main topic?", "Answer": "The main topic is X."}, {"Question": "Explain concept Y.", "Answer": "Concept Y is..."}]

Do NOT include any text, explanations, or markdown formatting outside of this JSON array string.
Ensure the JSON syntax is perfect, including correct use of quotes for all keys and string values, commas between objects (but not after the last object in the array), and proper brackets and braces.`;
      }
    } else {
      console.error("AI Flow: summarizeContentFlow - Neither fileDataUri nor userTextQuery provided. This should be caught by validation.");
      throw new Error("No input provided to AI flow. Please provide a file or a text query.");
    }
    
    promptMessages.push({ text: "\nTask Instructions (follow these carefully based on the input provided and desired format):\n" + mainInstruction });
    
    try {
      console.log("AI Flow: summarizeContentFlow - Calling ai.generate with model 'googleai/gemini-1.5-flash-latest'. Prompt messages preview:", JSON.stringify(promptMessages, null, 2).substring(0, 500) + "...");
      
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
      
      console.log("AI Flow: summarizeContentFlow - Raw response from ai.generate (output property):", JSON.stringify(response.output, null, 2).substring(0, 500) + "...");
      const output = response.output; 

      if (!output || typeof output.result !== 'string') {
        const receivedOutput = output ? JSON.stringify(output, null, 2) : 'null or undefined';
        console.error('AI Flow: summarizeContentFlow - AI model returned invalid or missing output structure. Output received:', receivedOutput);
        throw new Error('AI model did not return a valid output structure. Expected a JSON object with a "result" string field.');
      }
      console.log("AI Flow: summarizeContentFlow - Successfully received and parsed output. Result length:", output.result.length);
      return output;

    } catch (e: unknown) { 
      console.error('CRITICAL ERROR in AI Flow (summarizeContentFlow): Details below.');
      let errorMessage = 'AI flow failed during processing.';
      if (e instanceof Error) {
        console.error('Error Name:', e.name);
        console.error('Error Message:', e.message);
        if (e.stack) console.error('Error Stack:', e.stack);
        errorMessage = `AI flow failed: ${e.message}`;
        const anyError = e as any;
        if (anyError.details) console.error('Error Details:', anyError.details);
        if (anyError.status) console.error('Error Status:', anyError.status);
        if (anyError.cause) console.error('Error Cause:', anyError.cause);
      } else {
        console.error('Unknown error type caught:', e);
        errorMessage = 'An unknown error occurred in the AI flow processing.';
      }
      throw new Error(errorMessage);
    }
  }
);

    