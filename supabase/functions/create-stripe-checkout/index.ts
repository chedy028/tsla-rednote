/**
 * Supabase Edge Function: create-stripe-checkout
 * Creates a Stripe Checkout session for subscription payments.
 *
 * Environment variables required:
 *   STRIPE_SECRET_KEY  – Stripe secret key (sk_live_...)
 *   STRIPE_SUCCESS_URL – URL to redirect after successful payment
 *   STRIPE_CANCEL_URL  – URL to redirect if user cancels
 */

// ─── Types ───────────────────────────────────────────────────────────────────

type Plan = "basic" | "pro";
type BillingPeriod = "monthly" | "annual";

interface CheckoutRequest {
  plan: Plan;
  billingPeriod: BillingPeriod;
}

// ─── Stripe Price IDs ────────────────────────────────────────────────────────

const PRICE_IDS: Record<Plan, Record<BillingPeriod, string>> = {
  basic: {
    monthly: "price_1TCtEw0gWgiEMD9ZlUgpBlcc",   // $5/mo
    annual: "price_1TCtEy0gWgiEMD9Z9IlqZ5q0",     // $50/yr
  },
  pro: {
    monthly: "price_1TCtEx0gWgiEMD9Zg7hpcJFa",    // $10/mo
    annual: "price_1TCtF00gWgiEMD9Z8Qsza0GZ",     // $100/yr
  },
};

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
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body: CheckoutRequest = await req.json();
    const { plan, billingPeriod } = body;

    // ── Validate inputs ──────────────────────────────────────────────────

    if (!plan || !["basic", "pro"].includes(plan)) {
      return new Response(
        JSON.stringify({ error: "Invalid plan. Must be 'basic' or 'pro'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!billingPeriod || !["monthly", "annual"].includes(billingPeriod)) {
      return new Response(
        JSON.stringify({ error: "Invalid billingPeriod. Must be 'monthly' or 'annual'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Get Stripe secret key ────────────────────────────────────────────

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Payment system not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Resolve price ID ─────────────────────────────────────────────────

    const priceId = PRICE_IDS[plan][billingPeriod];

    // ── URLs ─────────────────────────────────────────────────────────────

    const baseSuccessUrl =
      Deno.env.get("STRIPE_SUCCESS_URL") ||
      "https://chedy028.github.io/tsla-rednote/";
    const cancelUrl =
      Deno.env.get("STRIPE_CANCEL_URL") ||
      "https://chedy028.github.io/tsla-rednote/";

    // Append session_id to success URL so the client can verify the payment
    const successUrl = `${baseSuccessUrl}?session_id={CHECKOUT_SESSION_ID}&payment=success`;

    // ── Create Stripe Checkout Session via API ───────────────────────────

    const params = new URLSearchParams();
    params.append("mode", "subscription");
    params.append("line_items[0][price]", priceId);
    params.append("line_items[0][quantity]", "1");
    params.append("success_url", successUrl);
    params.append("cancel_url", cancelUrl);
    params.append("allow_promotion_codes", "true");

    const stripeResp = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    const session = await stripeResp.json();

    if (!stripeResp.ok || !session.url) {
      console.error("Stripe error:", session);
      return new Response(
        JSON.stringify({
          error: "Failed to create checkout session",
          detail: session.error?.message ?? JSON.stringify(session),
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Return checkout URL ──────────────────────────────────────────────

    return new Response(
      JSON.stringify({
        url: session.url,
        session_id: session.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
