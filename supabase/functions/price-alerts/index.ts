/**
 * Supabase Edge Function: price-alerts
 * CRUD operations for TSLA price alerts (Pro feature).
 * Auth: Supabase Auth JWT (H5 magic link) or WeChat JWT.
 * Alerts are stored in Supabase and checked client-side.
 */
import { verifyAuth, errorResponse } from "../_shared/auth.ts";

// ─── CORS Headers ────────────────────────────────────────────────────────────

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-client-info, apikey",
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface AlertRequest {
  action: "list" | "create" | "delete" | "check";
  email: string;
  alert?: {
    type: "price_above" | "price_below" | "ps_above" | "ps_below";
    target_value: number;
  };
  alert_id?: string;
  current_price?: number;
  current_ps?: number;
}

// ─── Subscription Check ──────────────────────────────────────────────────────

async function checkSubscription(email: string): Promise<boolean> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const resp = await fetch(
    `${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=subscription_status,subscription_end_date`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    }
  );

  const profiles = await resp.json();
  if (!profiles || profiles.length === 0) return false;

  const profile = profiles[0];
  return (
    profile.subscription_status === "active" &&
    (!profile.subscription_end_date || new Date(profile.subscription_end_date) > new Date())
  );
}

// ─── DB Helpers ──────────────────────────────────────────────────────────────

const getHeaders = () => {
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return {
    "Content-Type": "application/json",
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    Prefer: "return=representation",
  };
};

async function listAlerts(email: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const resp = await fetch(
    `${supabaseUrl}/rest/v1/price_alerts?email=eq.${encodeURIComponent(email)}&is_active=eq.true&order=created_at.desc`,
    { headers: getHeaders() }
  );
  return resp.json();
}

async function createAlert(email: string, type: string, targetValue: number) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const resp = await fetch(`${supabaseUrl}/rest/v1/price_alerts`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      email,
      alert_type: type,
      target_value: targetValue,
      is_active: true,
      created_at: new Date().toISOString(),
    }),
  });
  return resp.json();
}

async function deleteAlert(alertId: string, email: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  // Soft delete by setting is_active = false, only if owned by this email
  const resp = await fetch(
    `${supabaseUrl}/rest/v1/price_alerts?id=eq.${alertId}&email=eq.${encodeURIComponent(email)}`,
    {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ is_active: false }),
    }
  );
  return resp.json();
}

async function checkAlerts(email: string, currentPrice?: number, currentPs?: number) {
  const alerts = await listAlerts(email);
  if (!Array.isArray(alerts)) return { triggered: [] };

  const triggered: Array<{ id: string; type: string; target: number; current: number }> = [];

  for (const alert of alerts) {
    let isTriggered = false;
    let current = 0;

    switch (alert.alert_type) {
      case "price_above":
        if (currentPrice != null && currentPrice >= alert.target_value) {
          isTriggered = true;
          current = currentPrice;
        }
        break;
      case "price_below":
        if (currentPrice != null && currentPrice <= alert.target_value) {
          isTriggered = true;
          current = currentPrice;
        }
        break;
      case "ps_above":
        if (currentPs != null && currentPs >= alert.target_value) {
          isTriggered = true;
          current = currentPs;
        }
        break;
      case "ps_below":
        if (currentPs != null && currentPs <= alert.target_value) {
          isTriggered = true;
          current = currentPs;
        }
        break;
    }

    if (isTriggered) {
      triggered.push({
        id: alert.id,
        type: alert.alert_type,
        target: alert.target_value,
        current,
      });
      // Deactivate triggered alert
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      await fetch(
        `${supabaseUrl}/rest/v1/price_alerts?id=eq.${alert.id}`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({ is_active: false, triggered_at: new Date().toISOString() }),
        }
      );
    }
  }

  return { triggered, total_active: alerts.length - triggered.length };
}

// ─── Main Handler ────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // ── Auth ────────────────────────────────────────────────────────────
    const auth = await verifyAuth(req);
    if ("error" in auth) {
      return errorResponse(auth.error, auth.status);
    }

    const body: AlertRequest = await req.json();
    const { action, email } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check subscription
    const isActive = await checkSubscription(email);
    if (!isActive) {
      return new Response(
        JSON.stringify({ error: "Active Pro subscription required", code: "SUB_REQUIRED" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result;

    switch (action) {
      case "list":
        result = await listAlerts(email);
        break;

      case "create":
        if (!body.alert?.type || body.alert?.target_value == null) {
          return new Response(
            JSON.stringify({ error: "Alert type and target_value required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        result = await createAlert(email, body.alert.type, body.alert.target_value);
        break;

      case "delete":
        if (!body.alert_id) {
          return new Response(
            JSON.stringify({ error: "alert_id required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        result = await deleteAlert(body.alert_id, email);
        break;

      case "check":
        result = await checkAlerts(email, body.current_price, body.current_ps);
        break;

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action. Use: list, create, delete, check" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
