
"use server";

import { summarizeContent, type SummarizeContentInput, type SummarizeContentOutput } from "@/ai/flows/summarize-content";
import { answerFollowUp, type AnswerFollowUpInput, type AnswerFollowUpOutput } from "@/ai/flows/answer-follow-up";
import { generateImage, type GenerateImageInput, type GenerateImageOutput } from "@/ai/flows/generate-image-flow";
import { z } from "zod";

const AssignmentFormSchema = z.object({
  fileDataUri: z.string().refine(val => val.startsWith('data:'), {
    message: "File data must be a valid data URI.",
  }).optional(),
  subjectTitle: z.string().min(1, "Subject title is required."),
  desiredFormat: z.enum(['Summary', 'Question Answering', 'Text', 'Explain']),
  userTextQuery: z.string().optional(),
}).refine(data => {
    const hasFileData = data.fileDataUri && data.fileDataUri.length > 'data:'.length; 
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
    fileDataUri: formData.get("fileDataUri")?.toString() || undefined,
    subjectTitle: formData.get("subjectTitle")?.toString(),
    desiredFormat: formData.get("desiredFormat")?.toString(),
    userTextQuery: formData.get("userTextQuery")?.toString() || undefined,
  };
  
  console.log("Server Action: Raw form data for validation (processAssignmentAction):", {
    subjectTitle: rawFormData.subjectTitle,
    desiredFormat: rawFormData.desiredFormat,
    fileDataUriLength: rawFormData.fileDataUri?.length || 0,
    userTextQueryPresent: !!rawFormData.userTextQuery,
  });


  try {
    const validatedFields = AssignmentFormSchema.safeParse(rawFormData);

    if (!validatedFields.success) {
      const validationErrors = validatedFields.error.flatten().fieldErrors;
      console.error("Server Action: Validation failed (processAssignmentAction). Errors:", JSON.stringify(validationErrors));
      return {
        errors: validationErrors,
        message: "Validation failed. Please check your inputs.",
        result: null,
      };
    }

    const { fileDataUri, subjectTitle, desiredFormat, userTextQuery } = validatedFields.data;
    
    const aiInput: SummarizeContentInput = {
      fileDataUri: fileDataUri || undefined,
      subjectTitle,
      desiredFormat: desiredFormat as 'Summary' | 'Question Answering' | 'Text' | 'Explain',
      userTextQuery: userTextQuery || undefined,
    };

    console.log("Server Action: Calling AI flow summarizeContent with input (data URI truncated if long):", JSON.stringify(aiInput, (key, value) => key === 'fileDataUri' && typeof value === 'string' && value.length > 100 ? `${value.substring(0,100)}...` : value));
    const resultFromFlow = await summarizeContent(aiInput);
    
    console.log("Server Action: AI flow (summarizeContent) completed. Result (truncated if long):", JSON.stringify(resultFromFlow, (key, value) => key === 'result' && typeof value === 'string' && value.length > 200 ? `${value.substring(0,200)}...` : value));
    
    return {
      result: resultFromFlow,
      message: "Processing successful! Here are your results.",
      errors: {},
    };

  } catch (error: unknown) {
    let userFriendlyMessage = "AI processing failed. Please check your input or try again later.";
    
    console.error("CRITICAL ERROR in processAssignmentAction (server action): Caught an error. Details below.");
    if (error instanceof Error) {
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        if (error.stack) console.error("Error Stack:", error.stack);
        userFriendlyMessage = `AI Processing Error: ${error.message}`;
        const anyError = error as any;
        if (anyError.details) console.error('Error Details (from action):', anyError.details);
        if (anyError.status) console.error('Error Status (from action):', anyError.status);
        if (anyError.cause) console.error('Error Cause (from action):', anyError.cause);
    } else {
        console.error("Unknown error type caught in server action (processAssignmentAction):", error);
    }
    
    const errorState: AssignmentFormState = {
      message: userFriendlyMessage,
      result: null,
      errors: { general: [userFriendlyMessage] } 
    };
    console.log("Server Action: Returning error state (processAssignmentAction). State:", JSON.stringify(errorState));
    return errorState;
  }
}


const FollowUpFormSchema = z.object({
  previousResultText: z.string().min(1, "Previous result text is required."),
  followUpQuery: z.string().optional(),
  subjectTitle: z.string().min(1, "Original subject title is required."),
  desiredFormat: z.enum(['Text', 'Summary', 'Question Answering', 'Explain']).describe("Original desired format to guide follow-up style."),
  fileDataUri: z.string().refine(val => val.startsWith('data:'), {
    message: "File data must be a valid data URI for follow-up.",
  }).optional(),
}).refine(data => {
    const hasFileData = data.fileDataUri && data.fileDataUri.length > 'data:'.length;
    const hasTextQuery = data.followUpQuery && data.followUpQuery.trim().length > 0;
    return hasFileData || hasTextQuery;
  }, {
  message: "Please provide either a follow-up question or attach a file.",
  path: ["general"], 
});

export type FollowUpFormState = {
  message?: string | null;
  followUpAnswer?: string | null;
  followUpImageUrl?: string | null;
  errors?: {
    previousResultText?: string[];
    followUpQuery?: string[];
    subjectTitle?: string[];
    desiredFormat?: string[];
    fileDataUri?: string[];
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
    followUpQuery: formData.get("followUpQuery")?.toString() || undefined,
    subjectTitle: formData.get("subjectTitle")?.toString(),
    desiredFormat: formData.get("desiredFormat")?.toString(),
    fileDataUri: formData.get("fileDataUri")?.toString() || undefined,
  };
  console.log("Server Action: Raw form data for processFollowUpAction (preview - data URIs truncated):", {
      followUpQueryLength: rawFormData.followUpQuery?.length,
      subjectTitle: rawFormData.subjectTitle,
      desiredFormat: rawFormData.desiredFormat,
      previousResultTextLength: rawFormData.previousResultText?.length,
      fileDataUriPresent: !!rawFormData.fileDataUri,
  });

  try {
    const validatedFields = FollowUpFormSchema.safeParse(rawFormData);
    if (!validatedFields.success) {
      const validationErrors = validatedFields.error.flatten().fieldErrors
      console.error("Server Action: Validation failed (processFollowUpAction).", validationErrors);
      return {
        errors: validationErrors,
        message: "Invalid follow-up input. Please check your question or file.",
        followUpAnswer: null,
        followUpImageUrl: null,
      };
    }

    const { previousResultText, followUpQuery, subjectTitle, desiredFormat, fileDataUri } = validatedFields.data;
    
    const aiInput: AnswerFollowUpInput = {
      previousResultText,
      followUpQuery: followUpQuery || undefined,
      subjectTitle,
      desiredFormat: desiredFormat as 'Text' | 'Summary' | 'Question Answering' | 'Explain',
      fileDataUri: fileDataUri || undefined,
    };

    console.log("Server Action: Calling AI flow answerFollowUp with input (data URIs truncated):", JSON.stringify(aiInput, (key, value) => (key === 'fileDataUri' || key === 'previousResultText') && typeof value === 'string' && value.length > 100 ? `${value.substring(0,100)}...` : value));
    const resultFromFlow: AnswerFollowUpOutput = await answerFollowUp(aiInput);
    
    console.log("Server Action: AI flow (answerFollowUp) completed. Answer (truncated):", resultFromFlow.followUpAnswer.substring(0,200) + "...", "ImageUrl present:", !!resultFromFlow.followUpImageUrl);
    return {
      message: "Follow-up processed successfully!",
      followUpAnswer: resultFromFlow.followUpAnswer,
      followUpImageUrl: resultFromFlow.followUpImageUrl,
      errors: {},
    };

  } catch (error: unknown) {
    let userFriendlyMessage = "Failed to process your follow-up question. Please try again.";
    console.error("CRITICAL ERROR in processFollowUpAction (server action): Caught an error. Details below.");
     if (error instanceof Error) {
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        if (error.stack) console.error("Error Stack:", error.stack);
        userFriendlyMessage = `Follow-up Error: ${error.message}`;
        const anyError = error as any;
        if (anyError.details) console.error('Error Details (from action):', anyError.details);
        if (anyError.status) console.error('Error Status (from action):', anyError.status);
        if (anyError.cause) console.error('Error Cause (from action):', anyError.cause);
    } else {
        console.error("CRITICAL ERROR in processFollowUpAction (server action): Caught an unknown error type.", error);
    }
    return {
      message: userFriendlyMessage,
      followUpAnswer: null,
      followUpImageUrl: null,
      errors: { general: [userFriendlyMessage] },
    };
  }
}

const ScheduleEmailNotificationSchema = z.object({
    eventId: z.string().min(1, "Event ID is required."),
    userEmail: z.string().email("A valid user email is required."),
    eventTitle: z.string().min(1, "Event title is required."),
    eventDateTime: z.string().datetime("Event date and time must be a valid ISO datetime string."),
});

export type ScheduleEmailNotificationFormState = {
    message: string | null;
    errors?: {
        eventId?: string[];
        userEmail?: string[];
        eventTitle?: string[];
        eventDateTime?: string[];
        general?: string[];
    };
};

export async function scheduleEmailNotificationAction(
    _prevState: unknown,
    formData: FormData
): Promise<ScheduleEmailNotificationFormState> {
    console.log("Server Action: scheduleEmailNotificationAction initiated.");
    const rawData = {
        eventId: formData.get("eventId")?.toString(),
        userEmail: formData.get("userEmail")?.toString(),
        eventTitle: formData.get("eventTitle")?.toString(),
        eventDateTime: formData.get("eventDateTime")?.toString(),
    };

    const validatedFields = ScheduleEmailNotificationSchema.safeParse(rawData);

    if (!validatedFields.success) {
        const validationErrors = validatedFields.error.flatten().fieldErrors;
        console.error("Server Action: scheduleEmailNotificationAction validation failed.", validationErrors);
        return {
            message: "Invalid data for scheduling email notification.",
            errors: validationErrors,
        };
    }

    const { eventId, userEmail, eventTitle, eventDateTime } = validatedFields.data;
    
    console.log(`Server Action (scheduleEmailNotificationAction): Conceptual email notification request for event ID: ${eventId}, User: ${userEmail}, Title: "${eventTitle}", Time: ${eventDateTime}.`);
    console.log("Server Action (scheduleEmailNotificationAction): In a real application, this request should be saved to a persistent database (e.g., Firestore) for a separate scheduled job (e.g., cron job calling /api/cron/send-event-reminders) to query and send emails via a service like Resend.");
    
    return {
        message: `Conceptual: Email notification for "${eventTitle}" has been noted. (Actual email sending requires backend setup and database integration).`,
        errors: {},
    };
}


const GenerateImageFormSchema = z.object({
  prompt: z.string().min(1, "Image prompt is required.").max(1000, "Prompt is too long."),
});

export type GenerateImageFormState = {
  message?: string | null;
  imageUrl?: string | null;
  errors?: {
    prompt?: string[];
    general?: string[];
  };
};

export async function generateImageAction(
  _prevState: unknown,
  formData: FormData
): Promise<GenerateImageFormState> {
  console.log("Server Action: generateImageAction initiated.");
  const rawFormData = {
    prompt: formData.get("prompt")?.toString(),
  };

  try {
    const validatedFields = GenerateImageFormSchema.safeParse(rawFormData);
    if (!validatedFields.success) {
      const validationErrors = validatedFields.error.flatten().fieldErrors;
      console.error("Server Action: Validation failed (generateImageAction).", validationErrors);
      return {
        errors: validationErrors,
        message: "Invalid image prompt.",
        imageUrl: null,
      };
    }

    const { prompt } = validatedFields.data;
    const aiInput: GenerateImageInput = { prompt };

    console.log("Server Action: Calling AI flow generateImage with input:", aiInput);
    const resultFromFlow: GenerateImageOutput = await generateImage(aiInput);
    console.log("Server Action: AI flow (generateImage) completed. Image URL length (first 100 chars):", resultFromFlow.imageUrl.substring(0,100) + "...");

    return {
      message: "Image generated successfully!",
      imageUrl: resultFromFlow.imageUrl,
      errors: {},
    };

  } catch (error: unknown) {
    let userFriendlyMessage = "Failed to generate image. Please try a different prompt or try again later.";
    console.error("CRITICAL ERROR in generateImageAction (server action): Caught an error. Details below.");
    if (error instanceof Error) {
      console.error("Error Name:", error.name);
      console.error("Error Message:", error.message);
      if (error.stack) console.error("Error Stack:", error.stack);
      userFriendlyMessage = `Image Generation Error: ${error.message}`;
      const anyError = error as any;
      if (anyError.details) console.error('Error Details (from action):', anyError.details);
      if (anyError.status) console.error('Error Status (from action):', anyError.status);
      if (anyError.cause) console.error('Error Cause (from action):', anyError.cause);
    } else {
      console.error("CRITICAL ERROR in generateImageAction (server action): Caught an unknown error type.", error);
    }
    return {
      message: userFriendlyMessage,
      imageUrl: null,
      errors: { general: [userFriendlyMessage] },
    };
  }
}

    