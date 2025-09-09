import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Audition {
  id: string;
  title: string;
  casting_director?: string;
  production_company?: string;
  audition_date?: string;
  submission_deadline?: string;
  reminder_time?: string;
  audition_type: string;
  user_id: string;
  actor_email?: string;
  profiles?: {
    full_name?: string;
    talent_email?: string;
  };
}

const generateReminderEmail = (audition: Audition, userName: string) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Audition Reminder</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px 20px; border-radius: 0 0 8px 8px; }
        .audition-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .detail-row { margin: 10px 0; }
        .label { font-weight: bold; color: #667eea; }
        .urgent { color: #e74c3c; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .cta-button { background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎭 Audition Reminder</h1>
        <p>Don't miss your upcoming audition!</p>
      </div>
      <div class="content">
        <p>Hi ${userName},</p>
        <p>This is a friendly reminder about your upcoming audition:</p>
        
        <div class="audition-card">
          <h2>${audition.title}</h2>
          
          <div class="detail-row">
            <span class="label">Audition Date:</span> ${formatDate(audition.audition_date)}
          </div>
          
          ${audition.submission_deadline ? `
          <div class="detail-row ${new Date(audition.submission_deadline) <= new Date(Date.now() + 24 * 60 * 60 * 1000) ? 'urgent' : ''}">
            <span class="label">Submission Deadline:</span> ${formatDate(audition.submission_deadline)}
            ${new Date(audition.submission_deadline) <= new Date(Date.now() + 24 * 60 * 60 * 1000) ? ' ⚠️ URGENT' : ''}
          </div>
          ` : ''}
          
          ${audition.casting_director ? `
          <div class="detail-row">
            <span class="label">Casting Director:</span> ${audition.casting_director}
          </div>
          ` : ''}
          
          ${audition.production_company ? `
          <div class="detail-row">
            <span class="label">Production Company:</span> ${audition.production_company}
          </div>
          ` : ''}
          
          <div class="detail-row">
            <span class="label">Audition Type:</span> ${audition.audition_type.replace('-', ' ').toUpperCase()}
          </div>
        </div>
        
        <p><strong>Action Items:</strong></p>
        <ul>
          <li>Review your script and character preparation</li>
          <li>Check your equipment (camera, lighting, audio)</li>
          <li>Prepare your slate and any required materials</li>
          <li>Double-check submission requirements</li>
        </ul>
        
        <div style="text-align: center;">
          <a href="https://cqlczzkyktktaajbfmli.supabase.co" class="cta-button">
            View Audition Details
          </a>
        </div>
        
        <div class="footer">
          <p>Good luck with your audition! 🌟</p>
          <p><small>This reminder was sent from your Audition Tracker. To manage your reminder preferences, log into your dashboard.</small></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Starting audition reminder check...");

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current time and calculate reminder window
    const now = new Date();
    const reminderWindow = new Date(now.getTime() + 60 * 60 * 1000); // Next hour

    console.log(`Checking for reminders between ${now.toISOString()} and ${reminderWindow.toISOString()}`);

    // Query auditions that need reminders
    const { data: auditions, error: auditionsError } = await supabase
      .from('auditions')
      .select(`
        id,
        title,
        casting_director,
        production_company,
        audition_date,
        submission_deadline,
        reminder_time,
        audition_type,
        user_id,
        actor_email
      `)
      .eq('reminder_enabled', true)
      .eq('reminder_sent', false)
      .lte('reminder_time', reminderWindow.toISOString())
      .gte('reminder_time', now.toISOString());

    if (auditionsError) {
      console.error('Error fetching auditions:', auditionsError);
      throw auditionsError;
    }

    console.log(`Found ${auditions?.length || 0} auditions needing reminders`);

    if (!auditions || auditions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No reminders to send', processed: 0 }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    let successCount = 0;
    let errorCount = 0;

    // Process each audition
    for (const audition of auditions) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, talent_email')
          .eq('id', audition.user_id)
          .maybeSingle();

        if (profileError) {
          console.warn(`Error fetching profile for user ${audition.user_id}:`, profileError);
        }

        const recipient = audition.actor_email || profile?.talent_email;
        const userName = profile?.full_name || 'Actor';

        if (!recipient) {
          console.warn(`No recipient email found for user ${audition.user_id}, audition ${audition.id}`);
          errorCount++;
          continue;
        }

        console.log(`Sending reminder for audition "${audition.title}" to ${recipient}`);

        // Send reminder email
        const emailResponse = await resend.emails.send({
          from: "Audition Tracker <auditions@resend.dev>",
          to: [recipient],
          subject: `🎭 Reminder: ${audition.title} Audition`,
          html: generateReminderEmail(audition, userName),
        });

        console.log(`Email sent successfully for audition ${audition.id}:`, emailResponse);

        // Mark reminder as sent
        const { error: updateError } = await supabase
          .from('auditions')
          .update({ reminder_sent: true })
          .eq('id', audition.id);

        if (updateError) {
          console.error(`Error updating reminder status for audition ${audition.id}:`, updateError);
          errorCount++;
        } else {
          successCount++;
        }

      } catch (emailError) {
        console.error(`Error sending email for audition ${audition.id}:`, emailError);
        errorCount++;
      }
    }

    console.log(`Reminder processing complete. Success: ${successCount}, Errors: ${errorCount}`);

    return new Response(
      JSON.stringify({
        message: 'Reminder processing complete',
        processed: auditions.length,
        success: successCount,
        errors: errorCount
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-audition-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);