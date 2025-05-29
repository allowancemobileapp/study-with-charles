// src/app/api/cron/send-event-reminders/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// IMPORTANT: Store your Resend API key in Vercel Environment Variables as RESEND_API_KEY
const resendApiKey = process.env.RESEND_API_KEY;
let resend: Resend | null = null;

if (resendApiKey) {
  try {
    resend = new Resend(resendApiKey);
    console.log("CRON JOB: Resend client initialized successfully.");
  } catch (e) {
    console.error("CRON JOB: Failed to initialize Resend client. Check RESEND_API_KEY.", e);
  }
} else {
  console.error("CRON JOB: RESEND_API_KEY environment variable is not set.");
}

export async function GET(request: Request) { // Added request parameter for Vercel Cron Job best practices
  // For Vercel Cron Jobs, you might want to secure this endpoint.
  // Example: Check a secret passed in the header by the cron job configuration.
  // const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '');
  // if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
  //   console.warn("CRON JOB: Unauthorized access attempt to send-event-reminders.");
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  console.log("CRON JOB: /api/cron/send-event-reminders - API Route called.");

  if (!resend) {
    console.error("CRON JOB: Resend client not initialized. Cannot send email.");
    return NextResponse.json({ error: 'Email service not configured properly on the server.' }, { status: 500 });
  }

  try {
    // --- Database Query Logic (Placeholder) ---
    // In a real application, you would:
    // 1. Connect to your database (e.g., Firestore).
    // 2. Query for events that are due for notification.
    // --- End of Database Query Logic (Placeholder) ---

    console.log("CRON JOB: Attempting to send sample email via Resend.");
    const { data, error } = await resend.emails.send({
      from: 'Study with Charles <onboarding@resend.dev>', // Default Resend testing domain
      to: ['delivered@resend.dev'], // Resend's test inbox
      subject: 'Test Event Reminder from Study with Charles (CRON)',
      html: '<p>This is a test email from the Study with Charles cron job. If you see this, Resend is configured and the API route is working!</p>',
    });

    if (error) {
      console.error("CRON JOB: Error sending sample email via Resend:", JSON.stringify(error));
      return NextResponse.json({ error: 'Failed to send sample email.', details: error.message }, { status: 500 });
    }

    console.log("CRON JOB: Sample email sent successfully via Resend. ID:", data?.id);
    return NextResponse.json({ message: 'Cron job executed. Sample email sent (if configured). Implement DB logic for real events.' });

  } catch (err: any) {
    console.error("CRON JOB: Unexpected error in send-event-reminders API route:", err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
