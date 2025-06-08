
'use server';
/**
 * @fileOverview An AI agent that generates images based on a text prompt.
 *
 * - generateImage - A function that handles the image generation process.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty.").describe('The text prompt to generate an image from.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    console.log("AI Flow: generateImageFlow - Initiated with prompt:", input.prompt);
    try {
      const {media, text} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp', 
        prompt: input.prompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'], 
          safetySettings: [ 
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        },
      });

      console.log("AI Flow: generateImageFlow - Raw response object from ai.generate():", JSON.stringify({media, text}, null, 2).substring(0, 1000) + (JSON.stringify({media, text}).length > 1000 ? "..." : ""));

      if (media && media.url) {
        console.log("AI Flow: generateImageFlow - Image generated successfully. Data URI length:", media.url.length);
        return { imageUrl: media.url };
      } else {
        console.error("AI Flow: generateImageFlow - Image generation failed, no media URL returned. Text response:", text);
        throw new Error(`Image generation did not produce an image. AI says: ${text || 'No additional information.'}`);
      }
    } catch (e: unknown) {
      console.error('CRITICAL ERROR in AI Flow (generateImageFlow): Details below.');
      let errorMessage = 'AI image generation flow failed.';
      if (e instanceof Error) {
        console.error('Error Name:', e.name);
        console.error('Error Message:', e.message);
        if (e.stack) console.error('Error Stack:', e.stack);
        errorMessage = `AI image generation flow failed: ${e.message}`;
        const anyError = e as any;
        if (anyError.details) console.error('Error Details:', anyError.details);
        if (anyError.status) console.error('Error Status:', anyError.status);
        if (anyError.cause) console.error('Error Cause:', anyError.cause);
      } else {
        console.error('Unknown error type caught in AI Flow (generateImageFlow):', e);
        errorMessage = 'An unknown error occurred in the AI image generation flow.';
      }
      throw new Error(errorMessage);
    }
  }
);

    