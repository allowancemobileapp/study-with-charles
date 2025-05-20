
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
    const hasFileData = data.fileDataUri && data.fileDataUri.startsWith('data:');
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

  const rawFormDataEntries = Object.fromEntries(formData.entries());
  console.log("Server Action: Raw form data entries received:", JSON.stringify(rawFormDataEntries, (key, value) => {
    if (key === 'fileDataUri' && typeof value === 'string' && value.length > 100) {
      return `${value.substring(0, 100)}... [truncated]`;
    }
    return value;
  }));

  const rawFormData = {
    fileDataUri: formData.get("fileDataUri")?.toString() || undefined,
    subjectTitle: formData.get("subjectTitle")?.toString(),
    desiredFormat: formData.get("desiredFormat")?.toString(),
    userTextQuery: formData.get("userTextQuery")?.toString() || undefined,
  };

  console.log("Server Action: Parsed form data for validation:", {
    subjectTitle: rawFormData.subjectTitle,
    desiredFormat: rawFormData.desiredFormat,
    fileDataUriLength: rawFormData.fileDataUri?.length || 0,
    userTextQueryPresent: !!rawFormData.userTextQuery,
  });

  try {
    const validatedFields = AssignmentFormSchema.safeParse(rawFormData);

    if (!validatedFields.success) {
      const validationErrors = validatedFields.error.flatten().fieldErrors;
      console.error("Server Action: Validation failed.", validationErrors);
      const errorState: AssignmentFormState = {
        errors: validationErrors,
        message: "Validation failed. Please check your inputs.",
        result: null,
      };
      console.log("Server Action: Returning validation error state:", JSON.stringify(errorState).substring(0,500));
      return errorState;
    }

    const { fileDataUri, subjectTitle, desiredFormat, userTextQuery } = validatedFields.data;
    console.log("Server Action: Validation successful. Input to AI flow:", { subjectTitle, desiredFormat, fileDataUriLength: fileDataUri?.length, userTextQueryPresent: !!userTextQuery });

    const aiInput: SummarizeContentInput = {
      fileDataUri: fileDataUri || undefined,
      subjectTitle,
      desiredFormat: desiredFormat as 'Text' | 'Summary' | 'Question Answering' | 'Explain', // Ensure correct type
      userTextQuery: userTextQuery || undefined,
    };

    console.log("Server Action: Calling AI flow summarizeContent...");
    const resultFromFlow = await summarizeContent(aiInput);

    if (!resultFromFlow || typeof resultFromFlow.result !== 'string') {
        console.error("Server Action: AI flow returned invalid or missing output structure. Result from flow:", resultFromFlow);
        throw new Error('AI model did not return a valid output structure. Expected an object with a "result" string field.');
    }

    console.log("Server Action: AI flow completed. Result from flow (first 300 chars of result field):", resultFromFlow.result.substring(0, 300) + (resultFromFlow.result.length > 300 ? "..." : ""));

    const successState: AssignmentFormState = {
      result: resultFromFlow,
      message: "Processing successful!",
      errors: {},
    };
    console.log("Server Action: Returning success state (preview):", { message: successState.message, resultLength: successState.result?.result.length });
    return successState;

  } catch (error: unknown) {
    console.error("CRITICAL ERROR in processAssignmentAction (server): Caught an error during AI processing or data handling.");
    let errorMessage = "An unexpected server error occurred during AI processing. Please try again.";

    if (error instanceof Error) {
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        if (error.stack) console.error("Error Stack:", error.stack);
        errorMessage = `AI Processing Error: ${error.message}`;
    } else if (typeof error === 'string') {
        console.error("Error (string type):", error);
        errorMessage = `AI Processing Error: ${error}`;
    } else {
        console.error("Unknown error type in server action:", error);
    }

    const errorState: AssignmentFormState = {
      message: errorMessage,
      result: null,
      errors: { general: [errorMessage] } // Keep general error for UI display
    };
    console.log("Server Action: Returning simplified error state:", JSON.stringify(errorState));
    return errorState;
  }
}
