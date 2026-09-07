// Bible book list, reference patterns, and spoken-number normalisation.
// Ported from app.html so both apps detect verses identically.

export const BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings',
  '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job',
  'Psalm', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
  'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
  'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum',
  'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
  '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians',
  'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy',
  'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
  '1 John', '2 John', '3 John', 'Jude', 'Revelation',
]

// Books that take a leading number match with or without it, so "corinthians 13:4"
// and "1 corinthians 13:4" both resolve. "Psalm" also accepts "Psalms".
const BOOK_PAT = BOOKS.map((b) => {
  const base = b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (/^\d+\s+/.test(b)) {
    const stem = base.replace(/^\d+\s+/, '')
    return `(?:\\d+\\s+)?${stem}`
  }
  if (b === 'Psalm') return 'Psalms?'
  return base
}).join('|')

const REF_SOURCE = `\\b(${BOOK_PAT})\\s+(?:chapter\\s+)?(\\d+)(?::|,?\\s+verse\\s+)(\\d+)`

export const VERSE_RE = new RegExp(REF_SOURCE, 'i')
export const VERSE_RE_G = new RegExp(REF_SOURCE, 'gi')

// ── Spoken number normalisation ──────────────────────────────────────────────
// "verse fifteen" → "verse 15", "chapter twenty-three" → "chapter 23",
// "the twenty-eighth verse" → "verse 28", "first Corinthians" → "1 Corinthians"

const W2N: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9,
  tenth: 10, eleventh: 11, twelfth: 12, thirteenth: 13, fourteenth: 14, fifteenth: 15,
  sixteenth: 16, seventeenth: 17, eighteenth: 18, nineteenth: 19,
  twentieth: 20, thirtieth: 30, fortieth: 40, fiftieth: 50, sixtieth: 60,
  seventieth: 70, eightieth: 80, ninetieth: 90,
}

const TENS = 'twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety'
const ONES_W = 'one|two|three|four|five|six|seven|eight|nine|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth'
// Compound ("twenty-three") first in the alternation so it wins over bare "twenty"
const NUM_PAT = `(?:${TENS})[-\\s](?:${ONES_W})|${Object.keys(W2N).join('|')}`

function toNum(s: string): number | null {
  let n = 0
  for (const p of s.toLowerCase().replace(/-/g, ' ').trim().split(/\s+/)) {
    const v = W2N[p]
    if (v === undefined) return null
    n += v
  }
  return n || null
}

export function normalizeSpokenNumbers(input: string): string {
  let t = input
  t = t.replace(
    new RegExp(`\\b(chapter|verse)\\s+(${NUM_PAT})\\b`, 'gi'),
    (m, kw: string, num: string) => {
      const n = toNum(num)
      return n ? `${kw} ${n}` : m
    }
  )
  t = t.replace(
    new RegExp(`\\bthe\\s+(${NUM_PAT})\\s+(chapter|verse)\\b`, 'gi'),
    (m, num: string, kw: string) => {
      const n = toNum(num)
      return n ? `${kw} ${n}` : m
    }
  )
  // Book ordinals: "first John" → "1 John"
  t = t.replace(/\bfirst\s+/gi, '1 ').replace(/\bsecond\s+/gi, '2 ').replace(/\bthird\s+/gi, '3 ')
  return t
}

/** Title-case a book name and normalise known alternate spellings. */
export function canonicaliseBook(raw: string): string {
  let b = raw.trim().split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
  if (/^Psalms$/i.test(b)) b = 'Psalm'
  if (/^Song Of Songs$/i.test(b)) b = 'Song of Solomon'
  if (/^Song Of Solomon$/i.test(b)) b = 'Song of Solomon'
  return b
}

/** Fuzzy book matching — catches near-misses from speech-to-text. */
export function fuzzyMatchBook(candidate: string): string | null {
  const c = candidate.toLowerCase().trim()
  if (c.length < 3) return null

  const exact = BOOKS.find((b) => b.toLowerCase() === c)
  if (exact) return exact
  if (c.length < 4) return null

  // Prefix overlap ≥75%: "philip" → "Philippians"
  for (const b of BOOKS) {
    const stem = b.toLowerCase().replace(/^\d+\s+/, '')
    const minL = Math.min(c.length, stem.length)
    const maxL = Math.max(c.length, stem.length)
    if ((stem.startsWith(c) || c.startsWith(stem)) && minL / maxL >= 0.75) return b
  }
  // Numbered books spoken without the number: "corinthians" → "1 Corinthians"
  for (const b of BOOKS) {
    if (!/^\d/.test(b)) continue
    const stem = b.toLowerCase().replace(/^\d+\s+/, '')
    const minL = Math.min(c.length, stem.length)
    const maxL = Math.max(c.length, stem.length)
    if ((stem.startsWith(c) || c.startsWith(stem)) && minL / maxL >= 0.75) return b
  }
  return null
}
