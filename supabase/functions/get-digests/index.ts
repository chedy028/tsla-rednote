/**
 * Supabase Edge Function: get-digests
 * Returns digest history for the frontend feed.
 * Auth: Supabase Auth JWT or WeChat JWT.
 *
 * ACCESS CONTROL:
 *   Free users: single digest from 7 days ago (teaser)
 *   Pro users:  today's digest + full history (up to 30 entries)
 */

import { verifyAuth, errorResponse, corsHeaders } from "../_shared/auth.ts";

// ─── Main Handler ───────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const auth = await verifyAuth(req);
    if ("error" in auth) {
      return errorResponse(auth.error, auth.status);
    }

    const body = await req.json();
    const { email, limit = 30 } = body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const dbHeaders = {
      "Content-Type": "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    };

    // Check subscription status
    let isPro = false;
    if (email) {
      const subResp = await fetch(
        `${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=subscription_status,subscription_end_date`,
        { headers: dbHeaders },
      );
      const profiles = await subResp.json();
      if (profiles?.[0]) {
        isPro = profiles[0].subscription_status === "active" &&
          (!profiles[0].subscription_end_date || new Date(profiles[0].subscription_end_date) > new Date());
      }
    }

    if (isPro) {
      // Pro: return full history (up to limit)
      const digestResp = await fetch(
        `${supabaseUrl}/rest/v1/digests?order=date.desc&limit=${Math.min(limit, 30)}&select=date,zone,zone_changed,ps_ratio,price,content_zh,content_en,content_es,content_ja,content_ko,is_stale_data`,
        { headers: dbHeaders },
      );
      const digests = await digestResp.json();

      return new Response(
        JSON.stringify({ isPro: true, digests: digests || [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Free: return single digest from 7 days ago (teaser)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const teaserDate = sevenDaysAgo.toISOString().slice(0, 10);

    const teaserResp = await fetch(
      `${supabaseUrl}/rest/v1/digests?date=lte.${teaserDate}&order=date.desc&limit=1&select=date,zone,zone_changed,ps_ratio,price,content_zh,content_en,content_es,content_ja,content_ko`,
      { headers: dbHeaders },
    );
    const teaserDigests = await teaserResp.json();

    return new Response(
      JSON.stringify({ isPro: false, digests: teaserDigests || [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("get-digests error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
