
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
        result: null,
      };
    }

    const { fileDataUri, subjectTitle, desiredFormat } = validatedFields.data;

    const aiInput: SummarizeContentInput = {
      fileDataUri,
      subjectTitle,
      desiredFormat,
    };
    
    const resultFromFlow = await summarizeContent(aiInput);
    
    return { 
      result: resultFromFlow, 
      message: "Processing successful!",
    };

  } catch (error) { 
    console.error("CRITICAL ERROR in processAssignmentAction (server):", error); 
    
    let errorMessage = "An unexpected server error occurred. Please check server logs for details and try again.";
    if (error instanceof Error) {
        errorMessage = `AI Processing Error: ${error.message}`; 
    } else if (typeof error === 'string') {
        errorMessage = `AI Processing Error: ${error}`;
    }
    
    // Return a very simple error state to ensure serializability
    return {
      message: errorMessage,
      result: null,
      errors: { general: [errorMessage] } // Keep general error message for UI
    };
  }
}
