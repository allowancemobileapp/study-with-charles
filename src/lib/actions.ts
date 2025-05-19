
"use server";

import { summarizeContent, type SummarizeContentInput, type SummarizeContentOutput } from "@/ai/flows/summarize-content";
import { z } from "zod";

const AssignmentFormSchema = z.object({
  fileDataUri: z.string().refine(val => val.startsWith('data:'), {
    message: "File data must be a valid data URI.",
  }).optional(),
  subjectTitle: z.string().min(1, "Subject title is required."),
  desiredFormat: z.enum(['Text', 'Summary', 'Question Answering', 'Explain']),
  userTextQuery: z.string().optional(),
}).refine(data => {
    // Check if fileDataUri is present and appears to be a valid data URI structure (basic check)
    const hasFileData = data.fileDataUri && data.fileDataUri.startsWith('data:');
    // Check if userTextQuery is present and not just whitespace
    const hasTextQuery = data.userTextQuery && data.userTextQuery.trim().length > 0;
    return hasFileData || hasTextQuery;
  }, {
  message: "Please provide either a file or a text query.",
  path: ["general"], 
});


export type AssignmentFormState = {
  message?: string | null;
  result?: SummarizeContentOutput | null;
  errors?: {
    fileDataUri?: string[];
    subjectTitle?: string[];
    desiredFormat?: string[];
    userTextQuery?: string[];
    general?: string[]; 
  };
};

export async function processAssignmentAction(
  _prevState: unknown, 
  formData: FormData
): Promise<AssignmentFormState> {
  console.log("Server Action: processAssignmentAction initiated.");
  
  const rawFormData = {
    fileDataUri: formData.get("fileDataUri") || undefined, 
    subjectTitle: formData.get("subjectTitle"),
    desiredFormat: formData.get("desiredFormat"),
    userTextQuery: formData.get("userTextQuery") || undefined, 
  };
  console.log("Server Action: Raw form data received:", {
    subjectTitle: rawFormData.subjectTitle,
    desiredFormat: rawFormData.desiredFormat,
    fileDataUriLength: typeof rawFormData.fileDataUri === 'string' ? rawFormData.fileDataUri.length : 0,
    userTextQueryPresent: !!rawFormData.userTextQuery,
  });

  try {
    const validatedFields = AssignmentFormSchema.safeParse(rawFormData);

    if (!validatedFields.success) {
      console.error("Server Action: Validation failed.", validatedFields.error.flatten().fieldErrors);
      const validationErrorState: AssignmentFormState = {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Validation failed. Please check your inputs.",
        result: null,
      };
      console.log("Server Action: Returning validation error state:", JSON.stringify(validationErrorState).substring(0,500));
      return validationErrorState;
    }

    const { fileDataUri, subjectTitle, desiredFormat, userTextQuery } = validatedFields.data;
    console.log("Server Action: Validation successful. Input to AI flow:", { subjectTitle, desiredFormat, fileDataUriLength: fileDataUri?.length, userTextQueryPresent: !!userTextQuery });

    const aiInput: SummarizeContentInput = {
      fileDataUri: fileDataUri || undefined, 
      subjectTitle,
      desiredFormat,
      userTextQuery: userTextQuery || undefined, 
    };
    
    console.log("Server Action: Calling AI flow summarizeContent...");
    const resultFromFlow = await summarizeContent(aiInput);
    console.log("Server Action: AI flow completed. Result from flow (first 300 chars of result field):", resultFromFlow && resultFromFlow.result ? resultFromFlow.result.substring(0, 300) + "..." : "N/A or empty result field");
    
    const successState: AssignmentFormState = { 
      result: resultFromFlow, 
      message: "Processing successful!",
      errors: {}, 
    };
    console.log("Server Action: Returning success state:", JSON.stringify(successState).substring(0,500) + (JSON.stringify(successState).length > 500 ? "..." : ""));
    return successState;

  } catch (error: unknown) { 
    console.error("CRITICAL ERROR in processAssignmentAction (server): Caught an error during AI processing or data handling.");
    let errorMessage = "An unexpected server error occurred during AI processing. Please try again.";
    
    if (error instanceof Error) {
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        if (error.stack) console.error("Error Stack:", error.stack);
        // Use the error message from the caught error if it's a simple Error instance
        // This is often more informative than a generic message.
        errorMessage = `AI Processing Error: ${error.message}`; 
    } else if (typeof error === 'string') {
        console.error("Error (string):", error);
        errorMessage = `AI Processing Error: ${error}`;
    } else {
        console.error("Unknown error type in server action:", error);
    }
    
    const errorState: AssignmentFormState = {
      message: errorMessage,
      result: null,
      errors: { general: [errorMessage] } // Keep general error for UI display
    };
    console.log("Server Action: Returning error state:", JSON.stringify(errorState));
    return errorState;
  }
}
