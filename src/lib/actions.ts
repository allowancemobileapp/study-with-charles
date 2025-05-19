
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
    general?: string[]; // For errors not specific to a field
  };
};

export async function processAssignmentAction(
  prevState: AssignmentFormState | undefined,
  formData: FormData
): Promise<AssignmentFormState> {
  try {
    console.log("Server Action: processAssignmentAction initiated.");
    const validatedFields = AssignmentFormSchema.safeParse({
      fileDataUri: formData.get("fileDataUri"),
      subjectTitle: formData.get("subjectTitle"),
      desiredFormat: formData.get("desiredFormat"),
    });

    if (!validatedFields.success) {
      console.error("Server Action: Validation failed.", validatedFields.error.flatten().fieldErrors);
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Validation failed. Please check your inputs.",
        result: null,
      };
    }

    const { fileDataUri, subjectTitle, desiredFormat } = validatedFields.data;
    console.log("Server Action: Validation successful. Input:", { subjectTitle, desiredFormat });

    const aiInput: SummarizeContentInput = {
      fileDataUri,
      subjectTitle,
      desiredFormat,
    };
    
    console.log("Server Action: Calling AI flow summarizeContent...");
    const resultFromFlow = await summarizeContent(aiInput);
    console.log("Server Action: AI flow completed. Result:", resultFromFlow);
    
    return { 
      result: resultFromFlow, 
      message: "Processing successful!",
      errors: {}, // Explicitly clear errors on success
    };

  } catch (error) { 
    // Log the detailed error on the server for debugging
    console.error("CRITICAL ERROR in processAssignmentAction (server):", error); 
    
    // Determine a user-friendly error message
    let errorMessage = "An unexpected server error occurred. Please try again.";
    if (error instanceof Error) {
        // Use the message from the Error object if it's a standard Error
        errorMessage = `AI Processing Error: ${error.message}`; 
    } else if (typeof error === 'string') {
        // If the error is just a string
        errorMessage = `AI Processing Error: ${error}`;
    }
    
    // Return a simplified and serializable error state to the client
    return {
      message: errorMessage, // This will be displayed to the user
      result: null,
      errors: { general: [errorMessage] } // Keep general error message for UI
    };
  }
}
