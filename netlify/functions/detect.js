// netlify/functions/detect.js
// Server-side proxy for AI verse detection — keeps ANTHROPIC_API_KEY out of the browser.
//
// POST body:
//   transcript     Recent sermon transcript (string, truncated to 1000 chars)
//   confThreshold  Minimum confidence to accept, 0-100 (default 75)
//   sermonPlan     Optional array of planned verse references
//
// Env vars:
//   ANTHROPIC_API_KEY  Netlify → Site settings → Environment variables
//
// Returns: { ref: "Book Ch:V" | null, confidence: 0-100 }

const MODEL = "claude-haiku-4-5-20251001";

const MAX_TRANSCRIPT = 1000;
const MAX_PLAN_ITEMS = 20;
const MAX_PLAN_ITEM_LEN = 60;

// This endpoint costs money per call, so it is same-origin only — no wildcard CORS.
// The browser blocks cross-origin reads by default when no ACAO header is sent.
const JSON_HEADERS = { "Content-Type": "application/json" };

// ── In-memory rate limiter (per function instance) ───────────────────────────
// Tighter than the Bible proxy because each call hits a paid API.
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT     = 20;
const _rlStore       = new Map(); // ip → { count, resetAt }

function checkRateLimit(ip) {
  const now   = Date.now();
  const entry = _rlStore.get(ip);

  if (_rlStore.size > 5_000) {
    for (const [k, v] of _rlStore) {
      if (now > v.resetAt) _rlStore.delete(k);
    }
  }

  if (!entry || now > entry.resetAt) {
    _rlStore.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true };
  }
  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true };
}

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: { ...JSON_HEADERS, ...extraHeaders },
    body: JSON.stringify(body),
  };
}

// Strip anything that isn't plain text before it reaches the model.
function sanitise(str, maxLen) {
  if (typeof str !== "string") return "";
  return str
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: JSON_HEADERS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Use POST" });
  }

  // ── 1. Rate limit ─────────────────────────────────────────────────────────
  const ip = ((event.headers["x-forwarded-for"] || event.headers["client-ip"] || "unknown")
    .split(",")[0]).trim();
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    console.log(`[detect] rate limit exceeded for ip=${ip}`);
    return json(
      429,
      {
        error: `Rate limit exceeded — maximum ${RATE_LIMIT} AI detections per minute. Try again in ${rl.retryAfter}s.`,
        code: "rate_limited",
        retryAfter: rl.retryAfter,
      },
      { "Retry-After": String(rl.retryAfter) }
    );
  }

  // ── 2. Check env var ──────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log("[detect] ERROR: ANTHROPIC_API_KEY is not set");
    return json(503, {
      error: "AI detection is not configured on this server.",
      code: "not_configured",
    });
  }

  // ── 3. Parse and validate body ────────────────────────────────────────────
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Body must be valid JSON", code: "bad_request" });
  }

  const transcript = sanitise(body.transcript, MAX_TRANSCRIPT);
  if (!transcript) {
    return json(400, { error: "Missing or empty 'transcript'", code: "bad_request" });
  }

  let confThreshold = Number(body.confThreshold);
  if (!Number.isFinite(confThreshold)) confThreshold = 75;
  confThreshold = Math.min(100, Math.max(0, Math.round(confThreshold)));

  const sermonPlan = Array.isArray(body.sermonPlan)
    ? body.sermonPlan
        .map((r) => sanitise(r, MAX_PLAN_ITEM_LEN))
        .filter(Boolean)
        .slice(0, MAX_PLAN_ITEMS)
    : [];

  const planCtx = sermonPlan.length
    ? ` Today's sermon plan: ${sermonPlan.join(", ")}. If the transcript vaguely references one of these (e.g. "that verse in John", "the Romans passage"), prioritise it over an unrelated guess.`
    : "";

  // ── 4. Call Anthropic ─────────────────────────────────────────────────────
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 80,
        system: `Bible verse detector for live sermons. Identify the single verse referenced directly or by paraphrase/nickname (e.g. "the eagle verse"→Isaiah 40:31, "love is patient"→1 Corinthians 13:4). Rules: one verse only; use opening verse of a passage; full book names singular (Psalm not Psalms). Reply ONLY with valid JSON: {"ref":"Book Ch:V","confidence":0-100} or {"ref":null,"confidence":0} if unclear.${planCtx}`,
        messages: [{ role: "user", content: `Transcript: "${transcript}"\n\nVerse?` }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.log(`[detect] Anthropic returned ${res.status}: ${detail.slice(0, 300)}`);
      if (res.status === 401 || res.status === 403) {
        return json(502, {
          error: "The AI service rejected the server key.",
          code: "upstream_auth",
        });
      }
      if (res.status === 429) {
        return json(429, {
          error: "The AI service is rate limiting. Try again shortly.",
          code: "upstream_rate_limited",
        });
      }
      return json(502, { error: "AI service error", code: "upstream_error" });
    }

    const data = await res.json();
    const text = data?.content?.[0]?.text;
    if (!text) return json(200, { ref: null, confidence: 0 });

    const raw = text.trim().replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.log(`[detect] model returned non-JSON: ${raw.slice(0, 200)}`);
      return json(200, { ref: null, confidence: 0 });
    }

    if (!parsed.ref || Number(parsed.confidence) < confThreshold) {
      return json(200, { ref: null, confidence: Number(parsed.confidence) || 0 });
    }

    // Strip an accidental range: "John 3:16-17" → "John 3:16"
    const cleanRef = String(parsed.ref).replace(/-\d+$/, "").trim().slice(0, 60);

    return json(200, {
      ref: cleanRef,
      confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 0)),
    });

  } catch (e) {
    console.log(`[detect] fetch threw: ${e.name}: ${e.message}`);
    return json(502, { error: "Could not reach the AI service", code: "network" });
  }
};
