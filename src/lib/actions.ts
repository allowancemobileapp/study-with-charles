
"use server";

import { summarizeContent, type SummarizeContentInput, type SummarizeContentOutput } from "@/ai/flows/summarize-content";
import { z } from "zod";

const AssignmentFormSchema = z.object({
  fileDataUri: z.string().refine(val => val.startsWith('data:'), {
    message: "File data must be a valid data URI.",
  }),
  subjectTitle: z.string().min(1, "Subject title is required."),
  desiredFormat: z.enum(['Text', 'Summary', 'Question Answering']),
});

export type AssignmentFormState = {
  message?: string | null;
  result?: SummarizeContentOutput | null;
  errors?: {
    fileDataUri?: string[];
    subjectTitle?: string[];
    desiredFormat?: string[];
    general?: string[];
  };
};

export async function processAssignmentAction(
  prevState: AssignmentFormState | undefined,
  formData: FormData
): Promise<AssignmentFormState> {
  try {
    const validatedFields = AssignmentFormSchema.safeParse({
      fileDataUri: formData.get("fileDataUri"),
      subjectTitle: formData.get("subjectTitle"),
      desiredFormat: formData.get("desiredFormat"),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Validation failed. Please check your inputs.",
        result: null, // Ensure result is explicitly null for error states
      };
    }

    const { fileDataUri, subjectTitle, desiredFormat } = validatedFields.data;

    const aiInput: SummarizeContentInput = {
      fileDataUri,
      subjectTitle,
      desiredFormat,
    };
    
    // The summarizeContent flow is expected to handle its own errors and
    // throw a standard Error if something goes wrong, or return SummarizeContentOutput.
    // Any error thrown by summarizeContent will be caught by the catch block below.
    const resultFromFlow = await summarizeContent(aiInput);
    
    // If the flow completes successfully, resultFromFlow should be valid.
    // The flow itself checks for !output || typeof output.result !== 'string'
    // and throws an error if that condition is met.
    return { 
      result: resultFromFlow, 
      message: "Processing successful!",
      // errors can be undefined if there are no errors
    };

  } catch (error) { 
    console.error("Error in processAssignmentAction (server):", error); // Log the full error on the server
    
    let errorMessage = "An unexpected server error occurred. Please check server logs for details and try again.";
    if (error instanceof Error) {
        // Use the message from the error caught, which might be from the AI flow
        errorMessage = error.message; 
    } else if (typeof error === 'string') {
        errorMessage = error;
    }
    
    // Return a consistent, serializable error state
    return {
      message: errorMessage, 
      errors: { general: [errorMessage] },
      result: null, 
    };
  }
}
