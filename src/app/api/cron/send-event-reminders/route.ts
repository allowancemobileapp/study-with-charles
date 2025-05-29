// src/app/api/cron/send-event-reminders/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// IMPORTANT: Store your Resend API key in Vercel Environment Variables as RESEND_API_KEY
const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  // This endpoint should be secured if it's public, e.g., by checking a secret cron token.
  // For Vercel Cron Jobs, you can set a CRON_SECRET environment variable
  // and check it here:
  // const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '');
  // if (cronSecret !== process.env.CRON_SECRET) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  console.log("CRON JOB: /api/cron/send-event-reminders - API Route called.");

  try {
    // --- Database Query Logic (Placeholder) ---
    // In a real application, you would:
    // 1. Connect to your database (e.g., Firestore).
    // 2. Query for events that are due for notification (e.g., eventDateTime is within the next X minutes
    //    and status is 'pending').
    //
    // Example placeholder logic:
    // const dueEvents = await getDueEventsFromDatabase();
    //
    // if (dueEvents.length === 0) {
    //   console.log("CRON JOB: No due events found for notification.");
    //   return NextResponse.json({ message: 'No due events to process.' });
    // }
    //
    // for (const event of dueEvents) {
    //   await resend.emails.send({
    //     from: 'Study with Charles <notifications@yourverifieddomain.com>', // Replace with your verified Resend sending domain
    //     to: event.userEmail,
    //     subject: `Reminder: ${event.eventTitle}`,
    //     html: `<p>Hi there,</p><p>This is a reminder for your event: <strong>${event.eventTitle}</strong> scheduled for ${new Date(event.eventDateTime).toLocaleString()}.</p><p>Best,</p><p>Study with Charles</p>`,
    //   });
    //   console.log(`CRON JOB: Email sent for event: ${event.eventTitle} to ${event.userEmail}`);
    //   // Update event status in database to 'sent'
    //   // await updateEventStatusInDatabase(event.id, 'sent');
    // }
    // --- End of Database Query Logic (Placeholder) ---

    // For demonstration, sending a sample email (REMOVE THIS IN PRODUCTION OR WHEN DB LOGIC IS ADDED)
    // Replace 'delivered@resend.dev' with a test email address if you want to see this sample.
    // Replace 'notifications@yourverifieddomain.com' with a domain you've verified with Resend.
    const { data, error } = await resend.emails.send({
      from: 'Study with Charles <onboarding@resend.dev>', // Default Resend testing domain
      to: ['delivered@resend.dev'], // Replace with your test email
      subject: 'Test Event Reminder from Study with Charles (CRON)',
      html: '<p>This is a test email from the Study with Charles cron job. If you see this, Resend is configured!</p>',
    });

    if (error) {
      console.error("CRON JOB: Error sending sample email via Resend:", error);
      return NextResponse.json({ error: 'Failed to send sample email.', details: error.message }, { status: 500 });
    }

    console.log("CRON JOB: Sample email sent successfully via Resend. ID:", data?.id);
    return NextResponse.json({ message: 'Cron job executed. Sample email sent (if configured). Implement DB logic for real events.' });

  } catch (err: any) {
    console.error("CRON JOB: Unexpected error in send-event-reminders API route:", err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
