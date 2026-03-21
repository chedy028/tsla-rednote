/**
 * Supabase Edge Function: send-digest-email
 * Cron job that runs at 6:15 AM UTC (after generate-daily-digest).
 * Sends daily digest emails to Pro subscribers via Resend API.
 *
 * ARCHITECTURE:
 *   pg_cron → HTTP POST → this function
 *     ↓
 *   1. Read today's digest from DB
 *   2. Query Pro users with active email preferences
 *   3. Send emails in batches of 50 via Resend
 *   4. If zone_changed: send alert-style email
 *
 * RETRY: If no digest found, retries once at 6:30 AM pattern
 *   (caller handles retry scheduling via pg_cron)
 *
 * ENV VARS:
 *   RESEND_API_KEY — Resend API key
 *   DIGEST_FROM_EMAIL — sender email (default: digest@tsla-rednote.com)
 */

// ─── Types ───────────────────────────────────────────────────────────────────

interface Digest {
  date: string;
  zone: string;
  zone_changed: boolean;
  ps_ratio: number;
  price: number;
  content_zh: string;
  content_en: string;
  content_es: string;
  content_ja: string;
  content_ko: string;
}

interface UserPref {
  email: string;
  language: string;
  alert_on_zone_change: boolean;
}

// ─── Email Template ──────────────────────────────────────────────────────────

const ZONE_EMOJI: Record<string, string> = {
  BARGAIN: "💚",
  CHEAP: "🟢",
  FAIR: "🟡",
  EXPENSIVE: "🟠",
  OVERPRICED: "🔴",
};

const SUBJECT_TEMPLATES: Record<string, (zone: string, price: number, changed: boolean) => string> = {
  zh: (zone, price, changed) => changed
    ? `⚡ TSLA 估值信号变化！${ZONE_EMOJI[zone] || ""} $${price.toFixed(2)}`
    : `${ZONE_EMOJI[zone] || ""} TSLA 每日估值 — $${price.toFixed(2)}`,
  en: (zone, price, changed) => changed
    ? `⚡ TSLA Zone Change! ${ZONE_EMOJI[zone] || ""} $${price.toFixed(2)}`
    : `${ZONE_EMOJI[zone] || ""} TSLA Daily Digest — $${price.toFixed(2)}`,
  es: (zone, price, changed) => changed
    ? `⚡ ¡Cambio de zona TSLA! ${ZONE_EMOJI[zone] || ""} $${price.toFixed(2)}`
    : `${ZONE_EMOJI[zone] || ""} TSLA Informe diario — $${price.toFixed(2)}`,
  ja: (zone, price, changed) => changed
    ? `⚡ TSLAゾーン変化！${ZONE_EMOJI[zone] || ""} $${price.toFixed(2)}`
    : `${ZONE_EMOJI[zone] || ""} TSLA デイリーダイジェスト — $${price.toFixed(2)}`,
  ko: (zone, price, changed) => changed
    ? `⚡ TSLA 존 변경! ${ZONE_EMOJI[zone] || ""} $${price.toFixed(2)}`
    : `${ZONE_EMOJI[zone] || ""} TSLA 데일리 다이제스트 — $${price.toFixed(2)}`,
};

function buildEmailHtml(digest: Digest, lang: string): string {
  const contentKey = `content_${lang}` as keyof Digest;
  const content = (digest[contentKey] as string) || digest.content_en;
  const emoji = ZONE_EMOJI[digest.zone] || "📊";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f8f9fa;">
  <div style="background:white;border-radius:16px;padding:32px;margin-bottom:16px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:48px;">${emoji}</div>
      <div style="font-size:28px;font-weight:bold;color:#1a1a1a;margin-top:8px;">TSLA ${digest.zone}</div>
      <div style="font-size:20px;color:#666;margin-top:4px;">P/S ${Number(digest.ps_ratio).toFixed(2)}x · $${Number(digest.price).toFixed(2)}</div>
    </div>
    <div style="font-size:16px;color:#333;line-height:1.7;white-space:pre-wrap;">${content}</div>
  </div>
  <div style="text-align:center;padding:16px;">
    <a href="https://chedy028.github.io/tsla-rednote/" style="display:inline-block;background:#009d80;color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;">Open App</a>
  </div>
  <div style="text-align:center;font-size:12px;color:#999;padding:16px;">
    <a href="https://chedy028.github.io/tsla-rednote/?unsubscribe=1" style="color:#999;">Unsubscribe</a>
  </div>
</body>
</html>`;
}

// ─── Main Handler ───────────────────────────────────────────────────────────

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const fromEmail = Deno.env.get("DIGEST_FROM_EMAIL") || "TSLA Digest <digest@tsla-rednote.com>";
  const today = new Date().toISOString().slice(0, 10);

  const dbHeaders = {
    "Content-Type": "application/json",
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
  };

  try {
    // ── 1. Get today's digest ───────────────────────────────────────
    const digestResp = await fetch(
      `${supabaseUrl}/rest/v1/digests?date=eq.${today}&select=*`,
      { headers: dbHeaders },
    );
    const digests: Digest[] = await digestResp.json();

    if (!digests || digests.length === 0) {
      return new Response(
        JSON.stringify({ status: "no_digest", date: today, message: "Digest not yet generated" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const digest = digests[0];

    // ── 2. Get active Pro subscribers ────────────────────────────────
    // Paginate in batches of 50
    let offset = 0;
    let totalSent = 0;
    let totalFailed = 0;
    const batchSize = 50;

    while (true) {
      const usersResp = await fetch(
        `${supabaseUrl}/rest/v1/user_preferences?digest_frequency=neq.none&unsubscribed_at=is.null&hard_bounce_at=is.null&email_confirmed_at=not.is.null&select=email,language,alert_on_zone_change&limit=${batchSize}&offset=${offset}`,
        { headers: dbHeaders },
      );
      const users: UserPref[] = await usersResp.json();
      if (!users || users.length === 0) break;

      // ── 3. Send emails via Resend ──────────────────────────────────
      for (const user of users) {
        // Skip zone-change-only users if zone didn't change
        if (!digest.zone_changed && user.alert_on_zone_change && false) {
          // Currently all digest users get daily emails
          // Zone-change-only filtering can be added later
          continue;
        }

        const lang = user.language || "zh";
        const subjectFn = SUBJECT_TEMPLATES[lang] || SUBJECT_TEMPLATES.en;
        const subject = subjectFn(digest.zone, Number(digest.price), digest.zone_changed);
        const html = buildEmailHtml(digest, lang);

        try {
          const sendResp = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
              from: fromEmail,
              to: [user.email],
              subject,
              html,
            }),
          });

          if (sendResp.ok) {
            totalSent++;
          } else {
            const err = await sendResp.json();
            console.error(`Failed to send to ${user.email}:`, err);
            totalFailed++;

            // Mark hard bounces
            if (err.name === "validation_error" || sendResp.status === 422) {
              await fetch(
                `${supabaseUrl}/rest/v1/user_preferences?email=eq.${encodeURIComponent(user.email)}`,
                {
                  method: "PATCH",
                  headers: { ...dbHeaders, Prefer: "return=minimal" },
                  body: JSON.stringify({ hard_bounce_at: new Date().toISOString() }),
                },
              );
            }
          }
        } catch (err) {
          console.error(`Error sending to ${user.email}:`, err);
          totalFailed++;
        }
      }

      offset += batchSize;
      if (users.length < batchSize) break;
    }

    return new Response(
      JSON.stringify({
        status: "sent",
        date: today,
        zone: digest.zone,
        zone_changed: digest.zone_changed,
        total_sent: totalSent,
        total_failed: totalFailed,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("send-digest-email error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
