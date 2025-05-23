
"use server";

import { summarizeContent, type SummarizeContentInput, type SummarizeContentOutput } from "@/ai/flows/summarize-content";
import { answerFollowUp, type AnswerFollowUpInput, type AnswerFollowUpOutput } from "@/ai/flows/answer-follow-up"; // New import
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
  console.log("Server Action: Raw form data entries received for processAssignmentAction:", JSON.stringify(rawFormDataEntries, (key, value) => {
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

  console.log("Server Action: Parsed form data for validation (processAssignmentAction):", {
    subjectTitle: rawFormData.subjectTitle,
    desiredFormat: rawFormData.desiredFormat,
    fileDataUriLength: rawFormData.fileDataUri?.length || 0,
    userTextQueryPresent: !!rawFormData.userTextQuery,
  });

  try {
    const validatedFields = AssignmentFormSchema.safeParse(rawFormData);

    if (!validatedFields.success) {
      const validationErrors = validatedFields.error.flatten().fieldErrors;
      console.error("Server Action: Validation failed (processAssignmentAction).", validationErrors);
      const errorState: AssignmentFormState = {
        errors: validationErrors,
        message: "Validation failed. Please check your inputs.",
        result: null,
      };
      console.log("Server Action: Returning validation error state (processAssignmentAction):", JSON.stringify(errorState).substring(0,500));
      return errorState;
    }

    const { fileDataUri, subjectTitle, desiredFormat, userTextQuery } = validatedFields.data;
    console.log("Server Action: Validation successful. Input to AI flow (processAssignmentAction):", { subjectTitle, desiredFormat, fileDataUriLength: fileDataUri?.length, userTextQueryPresent: !!userTextQuery });

    const aiInput: SummarizeContentInput = {
      fileDataUri: fileDataUri || undefined,
      subjectTitle,
      desiredFormat: desiredFormat as 'Text' | 'Summary' | 'Question Answering' | 'Explain', 
      userTextQuery: userTextQuery || undefined,
    };

    console.log("Server Action: Calling AI flow summarizeContent...");
    const resultFromFlow = await summarizeContent(aiInput);

    if (!resultFromFlow || typeof resultFromFlow.result !== 'string') {
        console.error("Server Action: AI flow (summarizeContent) returned invalid or missing output structure. Result from flow:", resultFromFlow);
        throw new Error('AI model did not return a valid output structure. Expected an object with a "result" string field.');
    }

    console.log("Server Action: AI flow (summarizeContent) completed. Result from flow (first 300 chars of result field):", resultFromFlow.result.substring(0, 300) + (resultFromFlow.result.length > 300 ? "..." : ""));

    const successState: AssignmentFormState = {
      result: resultFromFlow,
      message: "Processing successful!",
      errors: {},
    };
    console.log("Server Action: Returning success state (processAssignmentAction) (preview):", { message: successState.message, resultLength: successState.result?.result.length });
    return successState;

  } catch (error: unknown) {
    let errorMessage = "An unexpected server error occurred during AI processing. Please try again.";
    if (error instanceof Error) {
        console.error("CRITICAL ERROR in processAssignmentAction (server): Caught an error during AI processing or data handling.", error.name, error.message, error.stack);
        errorMessage = `AI Processing Error: ${error.message}`;
    } else {
        console.error("CRITICAL ERROR in processAssignmentAction (server): Caught an unknown error type.", error);
    }
    
    const errorState: AssignmentFormState = {
      message: errorMessage,
      result: null,
      errors: { general: [errorMessage] }
    };
    console.log("Server Action: Returning error state (processAssignmentAction):", JSON.stringify(errorState));
    return errorState;
  }
}


// Schema for follow-up action
const FollowUpFormSchema = z.object({
  previousResultText: z.string().min(1, "Previous result text is required."),
  followUpQuery: z.string().min(1, "Follow-up question is required."),
  subjectTitle: z.string().min(1, "Original subject title is required."),
  desiredFormat: z.enum(['Text', 'Summary', 'Question Answering', 'Explain']).describe("Original desired format to guide follow-up style."),
});

export type FollowUpFormState = {
  message?: string | null;
  followUpAnswer?: string | null;
  errors?: {
    previousResultText?: string[];
    followUpQuery?: string[];
    subjectTitle?: string[];
    desiredFormat?: string[];
    general?: string[];
  };
};

export async function processFollowUpAction(
  _prevState: unknown,
  formData: FormData
): Promise<FollowUpFormState> {
  console.log("Server Action: processFollowUpAction initiated.");
  const rawFormData = {
    previousResultText: formData.get("previousResultText")?.toString(),
    followUpQuery: formData.get("followUpQuery")?.toString(),
    subjectTitle: formData.get("subjectTitle")?.toString(),
    desiredFormat: formData.get("desiredFormat")?.toString(),
  };
  console.log("Server Action: Raw form data for processFollowUpAction:", rawFormData);

  try {
    const validatedFields = FollowUpFormSchema.safeParse(rawFormData);
    if (!validatedFields.success) {
      console.error("Server Action: Validation failed (processFollowUpAction).", validatedFields.error.flatten().fieldErrors);
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Invalid follow-up input.",
        followUpAnswer: null,
      };
    }

    const { previousResultText, followUpQuery, subjectTitle, desiredFormat } = validatedFields.data;
    
    const aiInput: AnswerFollowUpInput = {
      previousResultText,
      followUpQuery,
      subjectTitle,
      desiredFormat: desiredFormat as 'Text' | 'Summary' | 'Question Answering' | 'Explain',
    };

    console.log("Server Action: Calling AI flow answerFollowUp...");
    const resultFromFlow: AnswerFollowUpOutput = await answerFollowUp(aiInput);

    if (!resultFromFlow || typeof resultFromFlow.followUpAnswer !== 'string') {
      console.error("Server Action: AI flow (answerFollowUp) returned invalid or missing output. Result:", resultFromFlow);
      throw new Error('AI model did not return a valid follow-up answer.');
    }
    
    console.log("Server Action: AI flow (answerFollowUp) completed. Answer length:", resultFromFlow.followUpAnswer.length);
    return {
      message: "Follow-up processed.",
      followUpAnswer: resultFromFlow.followUpAnswer,
      errors: {},
    };

  } catch (error: unknown) {
    let errorMessage = "Failed to process follow-up question.";
     if (error instanceof Error) {
        console.error("CRITICAL ERROR in processFollowUpAction (server):", error.name, error.message, error.stack);
        errorMessage = `Follow-up Error: ${error.message}`;
    } else {
        console.error("CRITICAL ERROR in processFollowUpAction (server): Caught an unknown error type.", error);
    }
    return {
      message: errorMessage,
      followUpAnswer: null,
      errors: { general: [errorMessage] },
    };
  }
}


    