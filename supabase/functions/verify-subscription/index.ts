import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Types ───────────────────────────────────────────────────────────────────

interface VerifySubscriptionRequest {
  openid: string;
}

interface VerifySubscriptionResponse {
  is_active: boolean;
  expires_at: string | null;
}

interface ErrorResponse {
  error: string;
  detail?: string;
}

interface ProfileRecord {
  id: string;
  wechat_openid: string;
  subscription_status: string;
  subscription_expires_at: string | null;
}

// ─── CORS Headers ────────────────────────────────────────────────────────────

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-client-info, apikey",
};

// ─── Main Handler ────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" } satisfies ErrorResponse),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body: VerifySubscriptionRequest = await req.json();
    const { openid } = body;

    // ── Validate inputs ──────────────────────────────────────────────────

    if (!openid || typeof openid !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'openid'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Query profile ────────────────────────────────────────────────────

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, wechat_openid, subscription_status, subscription_expires_at")
      .eq("wechat_openid", openid)
      .maybeSingle();

    if (profileError) {
      console.error("Supabase query error:", profileError);
      return new Response(
        JSON.stringify({ error: "Database error", detail: profileError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!profile) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const profileRecord = profile as ProfileRecord;

    // ── Check subscription validity ──────────────────────────────────────

    let isActive = false;
    let expiresAt: string | null = profileRecord.subscription_expires_at;

    if (
      profileRecord.subscription_status === "active" &&
      profileRecord.subscription_expires_at
    ) {
      const expirationDate = new Date(profileRecord.subscription_expires_at);
      const now = new Date();

      if (expirationDate > now) {
        // Subscription is still active
        isActive = true;
      } else {
        // Subscription has expired — update the status
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            subscription_status: "expired",
            updated_at: new Date().toISOString(),
          })
          .eq("wechat_openid", openid);

        if (updateError) {
          console.error("Failed to update expired subscription:", updateError);
        }

        isActive = false;
      }
    }

    // ── Return response ──────────────────────────────────────────────────

    const response: VerifySubscriptionResponse = {
      is_active: isActive,
      expires_at: expiresAt,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
