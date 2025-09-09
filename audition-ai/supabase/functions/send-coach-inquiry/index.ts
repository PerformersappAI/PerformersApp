
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface InquiryRequest {
  coachSlug: string;
  actorName: string;
  actorEmail: string;
  actorPhone?: string;
  message: string;
}

const generateEmailHtml = (coach: any, inquiry: InquiryRequest) => {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; color: #111; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">New Coaching Inquiry</h1>
        </div>
        
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #333; margin-top: 0;">Hello ${coach.name},</h2>
          
          <p style="color: #666;">You have received a new coaching inquiry through MyAuditionAI:</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Contact Information</h3>
            <p><strong>Name:</strong> ${inquiry.actorName}</p>
            <p><strong>Email:</strong> ${inquiry.actorEmail}</p>
            ${inquiry.actorPhone ? `<p><strong>Phone:</strong> ${inquiry.actorPhone}</p>` : ''}
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #764ba2; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Message</h3>
            <p style="white-space: pre-wrap; color: #555; line-height: 1.6;">${inquiry.message}</p>
          </div>
          
          <p style="color: #666; margin-top: 30px;">
            Please reply directly to <strong>${inquiry.actorEmail}</strong> to respond to this inquiry.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 14px;">
            This inquiry was sent through the MyAuditionAI platform.<br>
            If you have any questions, please contact support.
          </p>
        </div>
      </body>
    </html>
  `;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { coachSlug, actorName, actorEmail, actorPhone, message }: InquiryRequest = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Get coach details
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('*')
      .eq('slug', coachSlug)
      .eq('active', true)
      .maybeSingle();

    if (coachError || !coach) {
      return new Response(JSON.stringify({ error: 'Coach not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const inquiryData = { coachSlug, actorName, actorEmail, actorPhone, message };
    const html = generateEmailHtml(coach, inquiryData);

    // Determine recipients
    const recipients = [];
    const ownerEmail = Deno.env.get("OWNER_NOTIFICATIONS_EMAIL");
    
    if (coach.email) {
      recipients.push(coach.email);
    }
    
    // Always CC the owner if email is set
    if (ownerEmail && ownerEmail !== coach.email) {
      recipients.push(ownerEmail);
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No recipient email configured. Please contact the administrator to set up coach email addresses.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Sending inquiry to:', recipients);

    const emailResponse = await resend.emails.send({
      from: 'MyAuditionAI <inquiries@resend.dev>',
      to: recipients,
      replyTo: actorEmail,
      subject: `New Coaching Inquiry from ${actorName}`,
      html,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Inquiry sent successfully',
      emailResponse 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    console.error('Error in send-coach-inquiry:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
