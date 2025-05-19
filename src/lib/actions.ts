
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
  console.log("Server Action: processAssignmentAction initiated.");
  
  const rawFormData = {
    fileDataUri: formData.get("fileDataUri"),
    subjectTitle: formData.get("subjectTitle"),
    desiredFormat: formData.get("desiredFormat"),
  };
  console.log("Server Action: Raw form data received:", {
    subjectTitle: rawFormData.subjectTitle,
    desiredFormat: rawFormData.desiredFormat,
    fileDataUriLength: typeof rawFormData.fileDataUri === 'string' ? rawFormData.fileDataUri.length : 0,
  });

  try {
    const validatedFields = AssignmentFormSchema.safeParse(rawFormData);

    if (!validatedFields.success) {
      console.error("Server Action: Validation failed.", validatedFields.error.flatten().fieldErrors);
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Validation failed. Please check your inputs.",
        result: null,
      };
    }

    const { fileDataUri, subjectTitle, desiredFormat } = validatedFields.data;
    console.log("Server Action: Validation successful. Input to AI flow:", { subjectTitle, desiredFormat, fileDataUriLength: fileDataUri.length });

    const aiInput: SummarizeContentInput = {
      fileDataUri,
      subjectTitle,
      desiredFormat,
    };
    
    console.log("Server Action: Calling AI flow summarizeContent...");
    const resultFromFlow = await summarizeContent(aiInput);
    console.log("Server Action: AI flow completed. Result from flow:", JSON.stringify(resultFromFlow, null, 2).substring(0, 300) + "...");
    
    return { 
      result: resultFromFlow, 
      message: "Processing successful!",
      errors: {}, // Explicitly clear errors on success
    };

  } catch (error: unknown) { 
    console.error("CRITICAL ERROR in processAssignmentAction (server):");
    let errorMessage = "An unexpected server error occurred during AI processing. Please try again.";
    
    if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        errorMessage = `AI Processing Error: ${error.message}`; 
    } else if (typeof error === 'string') {
        console.error("Error (string):", error);
        errorMessage = `AI Processing Error: ${error}`;
    } else {
        console.error("Unknown error type in server action:", error);
    }
    
    return {
      message: errorMessage,
      result: null,
      errors: { general: [errorMessage] }
    };
  }
}
