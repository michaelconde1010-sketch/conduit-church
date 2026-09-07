// netlify/functions/bible.js
// Server-side proxy for API.Bible — keeps the API key out of the browser and avoids CORS.
//
// Query params:
//   ref         Verse reference, e.g. "John 3:16"
//   translation Translation code: KJV | NIV | ESV | NKJV
//
// Env vars:
//   BIBLE_API_KEY  Your API.Bible key (Netlify → Site settings → Environment variables)
//
// Returns: { ref, text, translation }

const APIBIBLE_IDS = {
  KJV:  "de4e12af7f28f599-02",
  NIV:  "78a9f6124f344018-01",
  ESV:  "f421fe261da7624f-01",
  NKJV: "de4e12af7f28f599-02", // NKJV falls back to KJV Bible (closest available)
};

// USFM book codes used by API.Bible verse IDs (e.g. "John 3:16" → "JHN.3.16")
const BOOK_USFM = {
  // Old Testament
  "Genesis":"GEN","Exodus":"EXO","Leviticus":"LEV","Numbers":"NUM","Deuteronomy":"DEU",
  "Joshua":"JOS","Judges":"JDG","Ruth":"RUT","1 Samuel":"1SA","2 Samuel":"2SA",
  "1 Kings":"1KI","2 Kings":"2KI","1 Chronicles":"1CH","2 Chronicles":"2CH",
  "Ezra":"EZR","Nehemiah":"NEH","Esther":"EST","Job":"JOB","Psalm":"PSA",
  "Proverbs":"PRO","Ecclesiastes":"ECC","Song of Solomon":"SNG",
  "Isaiah":"ISA","Jeremiah":"JER","Lamentations":"LAM","Ezekiel":"EZK","Daniel":"DAN",
  "Hosea":"HOS","Joel":"JOL","Amos":"AMO","Obadiah":"OBA","Jonah":"JON","Micah":"MIC",
  "Nahum":"NAM","Habakkuk":"HAB","Zephaniah":"ZEP","Haggai":"HAG","Zechariah":"ZEC","Malachi":"MAL",
  // New Testament
  "Matthew":"MAT","Mark":"MRK","Luke":"LUK","John":"JHN","Acts":"ACT","Romans":"ROM",
  "1 Corinthians":"1CO","2 Corinthians":"2CO","Galatians":"GAL","Ephesians":"EPH",
  "Philippians":"PHP","Colossians":"COL","1 Thessalonians":"1TH","2 Thessalonians":"2TH",
  "1 Timothy":"1TI","2 Timothy":"2TI","Titus":"TIT","Philemon":"PHM","Hebrews":"HEB",
  "James":"JAS","1 Peter":"1PE","2 Peter":"2PE","1 John":"1JN","2 John":"2JN",
  "3 John":"3JN","Jude":"JUD","Revelation":"REV",
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};

// ── In-memory rate limiter (per Netlify function instance) ────────────────────
// 30 requests per IP per 60-second rolling window.
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT     = 30;
const _rlStore       = new Map(); // ip → { count, resetAt }

function checkRateLimit(ip) {
  const now   = Date.now();
  const entry = _rlStore.get(ip);

  // Prune expired entries when the map grows large (prevents memory leak)
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

// Convert "Book Ch:Vs" → "USFM.CH.VS", e.g. "John 3:16" → "JHN.3.16"
function refToVerseId(ref) {
  const m = ref.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!m) return null;
  let book = m[1].trim();
  // Normalise alternate spellings that may arrive from the browser
  if (/^Psalms$/i.test(book))            book = "Psalm";
  if (/^Song\s+of\s+Songs$/i.test(book)) book = "Song of Solomon";
  const code = BOOK_USFM[book];
  console.log(`[bible] book="${book}" → USFM code=${code || "NOT_FOUND"}`);
  return code ? `${code}.${m[2]}.${m[3]}` : null;
}

// Extract text from either /verses/ or /passages/ response shape
function extractText(data) {
  return data?.data?.content ?? data?.data?.passages?.[0]?.content ?? null;
}

function json(statusCode, body) {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

exports.handler = async function (event) {
  // Handle preflight CORS request
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  // ── 0. Rate limit ─────────────────────────────────────────────────────────
  const ip = ((event.headers["x-forwarded-for"] || event.headers["client-ip"] || "unknown")
    .split(",")[0]).trim();
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    console.log(`[bible] rate limit exceeded for ip=${ip}`);
    return {
      statusCode: 429,
      headers: { ...CORS_HEADERS, "Retry-After": String(rl.retryAfter) },
      body: JSON.stringify({
        error: `Rate limit exceeded — maximum ${RATE_LIMIT} requests per minute. Try again in ${rl.retryAfter}s.`,
        retryAfter: rl.retryAfter,
      }),
    };
  }

  // ── 1. Check env var ──────────────────────────────────────────────────────
  const apiKey = process.env.BIBLE_API_KEY;
  if (!apiKey) {
    console.log("[bible] ERROR: BIBLE_API_KEY is not set");
    return json(503, { error: "BIBLE_API_KEY environment variable is not configured" });
  }
  console.log(`[bible] BIBLE_API_KEY present (length=${apiKey.length})`);

  // ── 2. Parse query params ─────────────────────────────────────────────────
  const { ref, translation } = event.queryStringParameters || {};
  console.log(`[bible] params: ref="${ref}" translation="${translation}"`);

  if (!ref)         return json(400, { error: "Missing query parameter: ref" });
  if (!translation) return json(400, { error: "Missing query parameter: translation" });

  // ── 3. Resolve Bible ID ───────────────────────────────────────────────────
  const bibleId = APIBIBLE_IDS[translation.toUpperCase()];
  console.log(`[bible] translation="${translation.toUpperCase()}" → bibleId="${bibleId || "NOT_SUPPORTED"}"`);
  if (!bibleId) {
    return json(400, { error: `Translation '${translation}' is not supported by this proxy` });
  }

  // ── 4. Convert ref → USFM verse ID ───────────────────────────────────────
  const verseId = refToVerseId(ref);
  console.log(`[bible] verseId="${verseId}"`);
  if (!verseId) {
    return json(400, { error: `Could not parse verse reference: '${ref}'` });
  }

  // ── 5. Try /verses/ endpoint ──────────────────────────────────────────────
  const versesUrl =
    `https://api.scripture.api.bible/v4/bibles/${bibleId}/verses/${verseId}` +
    `?content-type=text&include-verse-numbers=false`;

  console.log("Calling:", versesUrl);

  try {
    let res = await fetch(versesUrl, { headers: { "api-key": apiKey } });
    console.log(`[bible] /verses/ → HTTP ${res.status}`);

    // ── 6. On 404: sanity-check with hardcoded URL + try /passages/ ──────────
    if (res.status === 404) {
      // Hardcoded test: isolates whether the Bible ID / key combo works at all
      const hardcodedUrl =
        "https://api.scripture.api.bible/v4/bibles/de4e12af7f28f599-02/verses/JHN.3.16" +
        "?content-type=text&include-verse-numbers=false";
      console.log("[bible] /verses/ 404 — running hardcoded sanity check:", hardcodedUrl);
      const testRes = await fetch(hardcodedUrl, { headers: { "api-key": apiKey } });
      const testBody = await testRes.text().catch(() => "");
      console.log(`[bible] hardcoded test → HTTP ${testRes.status}: ${testBody.slice(0, 400)}`);

      // Fallback: try /passages/ — some API.Bible editions expose this path instead
      const passagesUrl =
        `https://api.scripture.api.bible/v4/bibles/${bibleId}/passages/${verseId}` +
        `?content-type=text&include-verse-numbers=false`;
      console.log("[bible] trying /passages/ alternative:", passagesUrl);
      res = await fetch(passagesUrl, { headers: { "api-key": apiKey } });
      console.log(`[bible] /passages/ → HTTP ${res.status}`);
    }

    // ── 7. Handle non-OK response ─────────────────────────────────────────────
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.log(`[bible] final error body: ${detail}`);
      if (res.status === 401 || res.status === 403) {
        return json(401, {
          error: "API.Bible rejected the key — check BIBLE_API_KEY in Netlify",
          apiBibleStatus: res.status,
          apiBibleBody: detail,
        });
      }
      return json(res.status, {
        error: `API.Bible returned ${res.status}`,
        apiBibleBody: detail,
        urlCalled: res.url || versesUrl,
      });
    }

    // ── 8. Extract and return text ────────────────────────────────────────────
    const data = await res.json();
    const text = extractText(data);
    console.log(`[bible] content length=${text ? text.length : 0}`);

    if (!text) {
      return json(404, {
        error: "API.Bible returned no verse content",
        apiBibleData: JSON.stringify(data).slice(0, 500),
      });
    }

    return json(200, {
      ref,
      text: text.replace(/\s+/g, " ").trim(),
      translation: translation.toUpperCase(),
    });

  } catch (e) {
    console.log(`[bible] fetch threw: ${e.name}: ${e.message}`);
    return json(502, { error: "Failed to reach API.Bible", detail: e.message });
  }
};
