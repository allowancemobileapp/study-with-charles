
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
  const validatedFields = AssignmentFormSchema.safeParse({
    fileDataUri: formData.get("fileDataUri"),
    subjectTitle: formData.get("subjectTitle"),
    desiredFormat: formData.get("desiredFormat"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Validation failed. Please check your inputs.",
    };
  }

  const { fileDataUri, subjectTitle, desiredFormat } = validatedFields.data;

  try {
    const aiInput: SummarizeContentInput = {
      fileDataUri,
      subjectTitle,
      desiredFormat,
    };
    
    const result = await summarizeContent(aiInput);

    if (!result || !result.result) {
      return { message: "AI processing failed to return a result.", errors: { general: ["AI processing failed."] } };
    }
    
    return { result, message: "Processing successful!" };

  } catch (error) {
    console.error("AI processing error:", error);
    let errorMessage = "An unexpected error occurred during AI processing.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return { message: errorMessage, errors: { general: [errorMessage] } };
  }
}
