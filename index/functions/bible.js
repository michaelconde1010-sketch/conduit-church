// netlify/functions/bible.js
// Server-side proxy for API.Bible — keeps the API key out of the browser and avoids CORS.
//
// Query params:
//   ref         Verse reference, e.g. "John 3:16"
//   translation Translation code: KJV | NIV | ESV | NKJV
//
// Env vars:
//   BIBLE_API_KEY  Your API.Bible key (set in Netlify site settings → Environment variables)
//
// Returns: { ref, text, translation }

const APIBIBLE_IDS = {
  KJV:  "de4e12af7f28f599-02",
  NIV:  "78a9f6124f344018-01",
  ESV:  "f421fe261da7624f-01",
  NKJV: "de4e12af7f28f599-02", // NKJV falls back to KJV Bible (closest available)
};

const BOOK_USFM = {
  "Genesis":"GEN","Exodus":"EXO","Leviticus":"LEV","Numbers":"NUM","Deuteronomy":"DEU",
  "Joshua":"JOS","Judges":"JDG","Ruth":"RUT","1 Samuel":"1SA","2 Samuel":"2SA",
  "1 Kings":"1KI","2 Kings":"2KI","1 Chronicles":"1CH","2 Chronicles":"2CH",
  "Ezra":"EZR","Nehemiah":"NEH","Esther":"EST","Job":"JOB","Psalm":"PSA",
  "Proverbs":"PRO","Ecclesiastes":"ECC","Song of Solomon":"SNG",
  "Isaiah":"ISA","Jeremiah":"JER","Lamentations":"LAM","Ezekiel":"EZK","Daniel":"DAN",
  "Hosea":"HOS","Joel":"JOL","Amos":"AMO","Obadiah":"OBA","Jonah":"JON","Micah":"MIC",
  "Nahum":"NAM","Habakkuk":"HAB","Zephaniah":"ZEP","Haggai":"HAG","Zechariah":"ZEC","Malachi":"MAL",
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

function refToVerseId(ref) {
  const m = ref.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!m) return null;
  let book = m[1].trim();
  // Normalise alternate spellings
  if (/^Psalms$/i.test(book)) book = "Psalm";
  if (/^Song of Songs$/i.test(book)) book = "Song of Solomon";
  const code = BOOK_USFM[book];
  return code ? `${code}.${m[2]}.${m[3]}` : null;
}

function json(statusCode, body) {
  return { statusCode, headers: CORS_HEADERS, body: JSON.stringify(body) };
}

exports.handler = async function (event) {
  // Handle preflight CORS request
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  const apiKey = process.env.BIBLE_API_KEY;
  if (!apiKey) {
    return json(503, { error: "BIBLE_API_KEY environment variable is not configured" });
  }

  const { ref, translation } = event.queryStringParameters || {};
  if (!ref) return json(400, { error: "Missing query parameter: ref" });
  if (!translation) return json(400, { error: "Missing query parameter: translation" });

  const bibleId = APIBIBLE_IDS[translation.toUpperCase()];
  if (!bibleId) {
    return json(400, { error: `Translation '${translation}' is not supported by this proxy` });
  }

  const verseId = refToVerseId(ref);
  if (!verseId) {
    return json(400, { error: `Could not parse verse reference: '${ref}'` });
  }

  const url =
    `https://api.scripture.api.bible/v4/bibles/${bibleId}/verses/${verseId}` +
    `?content-type=text&include-verse-numbers=false`;

  try {
    const res = await fetch(url, { headers: { "api-key": apiKey } });

    if (res.status === 401 || res.status === 403) {
      return json(401, { error: "API.Bible rejected the key — check BIBLE_API_KEY in Netlify" });
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return json(res.status, { error: `API.Bible returned ${res.status}`, detail });
    }

    const data = await res.json();
    const text = data?.data?.content;
    if (!text) {
      return json(404, { error: "API.Bible returned no verse content" });
    }

    return json(200, {
      ref,
      text: text.replace(/\s+/g, " ").trim(),
      translation: translation.toUpperCase(),
    });
  } catch (e) {
    return json(502, { error: "Failed to reach API.Bible", detail: e.message });
  }
};
