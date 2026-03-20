/**
 * Supabase Edge Function: check-subscription
 * Checks subscription status by email (for H5/web version).
 * Also handles Stripe webhook-style updates after checkout.
 */

// ─── CORS Headers ────────────────────────────────────────────────────────────

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-client-info, apikey",
};

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
    const { email, session_id } = await req.json();

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Payment system not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If session_id provided, verify the checkout session with Stripe
    if (session_id) {
      const sessionResp = await fetch(
        `https://api.stripe.com/v1/checkout/sessions/${session_id}`,
        {
          headers: {
            Authorization: `Bearer ${stripeSecretKey}`,
          },
        }
      );

      const session = await sessionResp.json();

      if (!sessionResp.ok) {
        return new Response(
          JSON.stringify({ is_active: false, plan: null, error: "Invalid session" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if payment was completed
      if (session.payment_status === "paid" && session.status === "complete") {
        // Get subscription details
        const subId = session.subscription;
        let plan = "basic";
        let currentPeriodEnd: string | null = null;

        if (subId) {
          const subResp = await fetch(
            `https://api.stripe.com/v1/subscriptions/${subId}`,
            {
              headers: { Authorization: `Bearer ${stripeSecretKey}` },
            }
          );
          const sub = await subResp.json();

          if (subResp.ok) {
            currentPeriodEnd = sub.current_period_end
              ? new Date(sub.current_period_end * 1000).toISOString()
              : null;

            // Check which product/price to determine plan
            const priceId = sub.items?.data?.[0]?.price?.id;
            if (
              priceId === "price_1TCtEx0gWgiEMD9Zg7hpcJFa" ||
              priceId === "price_1TCtF00gWgiEMD9Z8Qsza0GZ"
            ) {
              plan = "pro";
            }
          }
        }

        // Update Supabase profile if we have customer email
        const customerEmail = session.customer_details?.email || email;
        if (customerEmail) {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

          // Update profile subscription status
          await fetch(
            `${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(customerEmail)}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                Prefer: "return=minimal",
              },
              body: JSON.stringify({
                subscription_status: "active",
                stripe_subscription_id: subId || null,
                subscription_end_date: currentPeriodEnd,
                updated_at: new Date().toISOString(),
              }),
            }
          );
        }

        return new Response(
          JSON.stringify({
            is_active: true,
            plan,
            expires_at: currentPeriodEnd,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ is_active: false, plan: null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If email provided, check subscription from Supabase
    if (email) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      const profileResp = await fetch(
        `${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=subscription_status,subscription_end_date,stripe_subscription_id`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        }
      );

      const profiles = await profileResp.json();

      if (profiles && profiles.length > 0) {
        const profile = profiles[0];
        const isActive =
          profile.subscription_status === "active" &&
          (!profile.subscription_end_date ||
            new Date(profile.subscription_end_date) > new Date());

        return new Response(
          JSON.stringify({
            is_active: isActive,
            plan: isActive ? "pro" : null,
            expires_at: profile.subscription_end_date,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ is_active: false, plan: null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "email or session_id required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
