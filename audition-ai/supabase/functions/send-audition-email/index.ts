import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface SendRequest {
  auditionId: string;
  to?: string;
  test?: boolean;
}

const generateEmailHtml = (audition: any) => {
  const fmt = (d?: string) => (d ? new Date(d).toLocaleString() : 'Not specified');
  return `
    <html>
      <body style="font-family: Arial, sans-serif; color: #111;">
        <h2 style="margin:0 0 12px;">Audition: ${audition.title}</h2>
        <p><strong>Audition Date:</strong> ${fmt(audition.audition_date)}</p>
        ${audition.submission_deadline ? `<p><strong>Submission Deadline:</strong> ${fmt(audition.submission_deadline)}</p>` : ''}
        ${audition.casting_director ? `<p><strong>Casting Director:</strong> ${audition.casting_director}</p>` : ''}
        ${audition.production_company ? `<p><strong>Production Company:</strong> ${audition.production_company}</p>` : ''}
        ${audition.notes ? `<p><strong>Notes:</strong> ${audition.notes}</p>` : ''}
        <p style="margin-top:16px;">Good luck! 🎭</p>
      </body>
    </html>
  `;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { auditionId, to, test }: SendRequest = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      }
    );

    // Get the user to enforce ownership
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const userId = userData.user.id;

    // Fetch audition and ensure it belongs to the user
    const { data: audition, error: auditionError } = await supabase
      .from('auditions')
      .select('*')
      .eq('id', auditionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (auditionError || !audition) {
      return new Response(JSON.stringify({ error: 'Audition not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Determine recipient
    let recipient = to;
    if (!recipient) {
      // fallback to actor_email if set
      recipient = audition.actor_email;
    }

    if (!recipient && test) {
      // For tests without explicit to, default to the current user's email from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('talent_email')
        .eq('id', userId)
        .maybeSingle();
      recipient = profile?.talent_email || userData.user.email || undefined;
    }

    if (!recipient) {
      return new Response(JSON.stringify({ error: 'No recipient email provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const html = generateEmailHtml(audition);

    const emailResponse = await resend.emails.send({
      from: 'Audition Tracker <auditions@resend.dev>',
      to: [recipient],
      subject: `Audition: ${audition.title}`,
      html,
    });

    return new Response(JSON.stringify({ ok: true, emailResponse }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    console.error('Error in send-audition-email:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});