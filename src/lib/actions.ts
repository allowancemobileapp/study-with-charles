
"use server";

import { summarizeContent, type SummarizeContentInput, type SummarizeContentOutput } from "@/ai/flows/summarize-content";
import { answerFollowUp, type AnswerFollowUpInput, type AnswerFollowUpOutput } from "@/ai/flows/answer-follow-up";
import { z } from "zod";

const AssignmentFormSchema = z.object({
  fileDataUri: z.string().refine(val => val.startsWith('data:'), {
    message: "File data must be a valid data URI.",
  }).optional(),
  subjectTitle: z.string().min(1, "Subject title is required."),
  desiredFormat: z.enum(['Summary', 'Question Answering', 'Text', 'Explain']),
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
    general?: string[]; // For errors not specific to a field
  };
};

export async function processAssignmentAction(
  _prevState: unknown,
  formData: FormData
): Promise<AssignmentFormState> {
  console.log("Server Action: processAssignmentAction initiated.");

  const rawFormDataEntries = Object.fromEntries(formData.entries());
  console.log("Server Action: Raw form data entries received for processAssignmentAction (form data object):", JSON.stringify(rawFormDataEntries, (key, value) => {
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
      console.error("Server Action: Validation failed (processAssignmentAction). Errors:", JSON.stringify(validationErrors));
      const errorState: AssignmentFormState = {
        errors: validationErrors,
        message: "Validation failed. Please check your inputs.",
        result: null,
      };
      console.log("Server Action: Returning validation error state (processAssignmentAction). State:", JSON.stringify(errorState));
      return errorState;
    }

    const { fileDataUri, subjectTitle, desiredFormat, userTextQuery } = validatedFields.data;
    
    const aiInput: SummarizeContentInput = {
      fileDataUri: fileDataUri || undefined,
      subjectTitle,
      desiredFormat: desiredFormat as 'Summary' | 'Question Answering' | 'Text' | 'Explain',
      userTextQuery: userTextQuery || undefined,
    };

    console.log("Server Action: Calling AI flow summarizeContent with input:", JSON.stringify(aiInput, (key, value) => key === 'fileDataUri' && typeof value === 'string' && value.length > 100 ? `${value.substring(0,100)}...` : value));
    const resultFromFlow = await summarizeContent(aiInput);

    if (!resultFromFlow || typeof resultFromFlow.result !== 'string') {
        console.error("Server Action: AI flow (summarizeContent) returned invalid or missing output structure. Result from flow:", JSON.stringify(resultFromFlow).substring(0,500));
        throw new Error('AI model did not return a valid output structure after flow execution.');
    }

    console.log("Server Action: AI flow (summarizeContent) completed. Result field length:", resultFromFlow.result.length, "ImageUrl present:", !!resultFromFlow.imageUrl);
    console.log("Server Action: AI flow (summarizeContent) result preview (first 300 chars):", resultFromFlow.result.substring(0,300) + (resultFromFlow.result.length > 300 ? "..." : ""));
    
    const successState: AssignmentFormState = {
      result: resultFromFlow,
      message: "Processing successful! Here are your results.",
      errors: {},
    };
    console.log("Server Action: Returning success state (processAssignmentAction). State:", JSON.stringify(successState, (key, value) => key === 'result' && typeof value === 'object' && value?.result && value.result.length > 100 ? {...value, result: value.result.substring(0,100) + "..."} : value ));
    return successState;

  } catch (error: unknown) {
    let userFriendlyMessage = "AI processing failed. Please try again later.";
    
    console.error("CRITICAL ERROR in processAssignmentAction (server): Caught an error during AI processing or data handling.");
    if (error instanceof Error) {
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        if (error.stack) console.error("Error Stack:", error.stack);
        userFriendlyMessage = `AI Processing Error: ${error.message}`;
    } else {
        console.error("Unknown error type caught in server action:", error);
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
    const hasFileData = data.fileDataUri && data.fileDataUri.startsWith('data:');
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
  console.log("Server Action: Raw form data for processFollowUpAction (preview):", {
      followUpQueryLength: rawFormData.followUpQuery?.length,
      subjectTitle: rawFormData.subjectTitle,
      desiredFormat: rawFormData.desiredFormat,
      previousResultTextLength: rawFormData.previousResultText?.length,
      fileDataUriLength: rawFormData.fileDataUri?.length || 0,
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

    console.log("Server Action: Calling AI flow answerFollowUp with input:", JSON.stringify(aiInput, (key, value) => key === 'fileDataUri' && typeof value === 'string' && value.length > 100 ? `${value.substring(0,100)}...` : value));
    const resultFromFlow: AnswerFollowUpOutput = await answerFollowUp(aiInput);

    if (!resultFromFlow || typeof resultFromFlow.followUpAnswer !== 'string') {
      console.error("Server Action: AI flow (answerFollowUp) returned invalid or missing output. Result:", JSON.stringify(resultFromFlow));
      throw new Error('AI model did not return a valid follow-up answer.');
    }
    
    console.log("Server Action: AI flow (answerFollowUp) completed. Answer length:", resultFromFlow.followUpAnswer.length, "ImageUrl present:", !!resultFromFlow.followUpImageUrl);
    return {
      message: "Follow-up processed successfully!",
      followUpAnswer: resultFromFlow.followUpAnswer,
      followUpImageUrl: resultFromFlow.followUpImageUrl,
      errors: {},
    };

  } catch (error: unknown) {
    let userFriendlyMessage = "Failed to process your follow-up question. Please try again.";
     if (error instanceof Error) {
        console.error("CRITICAL ERROR in processFollowUpAction (server):", error.name, error.message, error.stack);
        if (error.message.includes("AI model did not return a valid")) {
            userFriendlyMessage = "The AI returned an unexpected response to your follow-up. Please try rephrasing.";
        } else {
            userFriendlyMessage = `Follow-up Error: ${error.message}`;
        }
    } else {
        console.error("CRITICAL ERROR in processFollowUpAction (server): Caught an unknown error type.", error);
    }
    return {
      message: userFriendlyMessage,
      followUpAnswer: null,
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

    // TODO - REAL IMPLEMENTATION REQUIRED:
    // 1. Store this notification request in a persistent database (e.g., Firestore).
    //    Example structure for Firestore document in 'eventNotifications' collection:
    //    {
    //      eventId: eventId,
    //      userEmail: userEmail,
    //      eventTitle: eventTitle,
    //      eventDateTime: new Date(eventDateTime), // Store as Firestore Timestamp
    //      status: "pending", // e.g., "pending", "sent", "error"
    //      userId: auth.currentUser.uid (if available and needed for user-specific queries)
    //    }
    // 2. A separate backend scheduler (e.g., Firebase Cloud Function triggered by Cloud Scheduler, or Vercel Cron Job)
    //    will query this database for pending notifications that are due.
    // 3. The scheduler will then use an email sending service (e.g., SendGrid, Resend) to send the actual email.
    // 4. After sending, the scheduler should update the status in the database.

    console.log(`Conceptual: Email notification registration for event ID: ${eventId}, User: ${userEmail}, Title: "${eventTitle}", Time: ${eventDateTime}. This would now be written to a database.`);
    
    return {
        message: `Email notification for "${eventTitle}" has been noted. (This is a conceptual step; actual email sending requires backend setup).`,
        errors: {},
    };
}
