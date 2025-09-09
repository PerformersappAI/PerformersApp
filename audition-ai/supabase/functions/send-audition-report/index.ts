import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportRequest {
  to?: string[] | string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

function toCSV(rows: any[]): string {
  const header = [
    "Title",
    "Casting Director",
    "Production Company",
    "Audition Date",
    "Type",
    "Status",
    "Created At",
  ];
  const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push([
      escape(r.title),
      escape(r.casting_director),
      escape(r.production_company),
      escape(r.audition_date ?? ""),
      escape(r.audition_type ?? ""),
      escape(r.status ?? ""),
      escape(r.created_at ?? ""),
    ].join(","));
  }
  return lines.join("\n");
}

function base64Encode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

function generateHtmlSummary(userEmail: string, stats: any, count: number, range?: {start?: string; end?: string}) {
  return `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111">
      <h1 style="margin: 0 0 12px; font-size: 22px">Your Audition Report</h1>
      <p style="margin: 0 0 16px; color: #444">Sent to: ${userEmail}</p>
      ${range?.start || range?.end ? `<p style="margin: 0 0 16px; color: #444">Range: ${range.start ?? '—'} to ${range.end ?? '—'}</p>` : ''}
      <div style="margin: 16px 0; padding: 12px; background: #f7f7f7; border-radius: 8px">
        <p style="margin: 0 0 8px"><strong>Total auditions:</strong> ${stats.total_auditions ?? count}</p>
        <p style="margin: 0 0 8px"><strong>Preparation:</strong> ${stats.preparation ?? 0}</p>
        <p style="margin: 0 0 8px"><strong>Submitted:</strong> ${stats.submitted ?? 0}</p>
        <p style="margin: 0 0 8px"><strong>Callbacks:</strong> ${stats.callback ?? 0}</p>
        <p style="margin: 0 0 8px"><strong>Booked:</strong> ${stats.booked ?? 0}</p>
        <p style="margin: 0 0 8px"><strong>Rejected:</strong> ${stats.rejected ?? 0}</p>
        <p style="margin: 0"><strong>Success rate:</strong> ${(stats.success_rate ?? 0)}%</p>
      </div>
      <p style="color: #555; font-size: 14px;">A CSV report is attached for your records.</p>
    </div>
  `;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, startDate, endDate } = (await req.json()) as ReportRequest;

    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY") as string;

    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch auditions for the user (optionally filter by date)
    let query = supabase
      .from("auditions")
      .select(
        "id,title,casting_director,production_company,audition_date,audition_type,status,created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (startDate) query = query.gte("audition_date", startDate);
    if (endDate) query = query.lte("audition_date", endDate);

    const { data: auditions, error: auditionsError } = await query;
    if (auditionsError) throw auditionsError;

    // Compute simple stats (fallback if RPC unavailable for range)
    const stats = {
      total_auditions: auditions?.length ?? 0,
      preparation: auditions?.filter((a) => a.status === "preparation").length ?? 0,
      submitted: auditions?.filter((a) => a.status === "submitted").length ?? 0,
      callback: auditions?.filter((a) => a.status === "callback").length ?? 0,
      booked: auditions?.filter((a) => a.status === "booked").length ?? 0,
      rejected: auditions?.filter((a) => a.status === "rejected").length ?? 0,
      success_rate:
        auditions && auditions.length > 0
          ? Math.round(((auditions.filter((a) => a.status === "booked").length / auditions.length) * 100) * 100) / 100
          : 0,
    };

    // CSV attachment
    const csv = toCSV(auditions ?? []);
    const csvB64 = base64Encode(csv);

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Determine recipients
    let recipients: string[] = [];
    if (Array.isArray(to)) recipients = to;
    else if (typeof to === "string" && to.trim().length > 0) recipients = [to];
    else if (user.email) recipients = [user.email];

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ error: "No recipient email provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const html = generateHtmlSummary(recipients.join(", "), stats, auditions?.length ?? 0, {
      start: startDate,
      end: endDate,
    });

    const emailResponse = await resend.emails.send({
      from: "Cast Coach <onboarding@resend.dev>",
      to: recipients,
      subject: "Your Audition Report",
      html,
      attachments: [
        {
          filename: "audition-report.csv",
          content: csvB64,
          contentType: "text/csv",
        } as any,
      ],
    } as any);

    console.log("Email sent:", emailResponse);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("send-audition-report error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
