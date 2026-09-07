// Verse detection: regex, fuzzy matching, and context memory.
// Ported from app.html.

import {
  VERSE_RE, VERSE_RE_G, normalizeSpokenNumbers, canonicaliseBook, fuzzyMatchBook,
} from './bible'

export interface DetectionResult {
  ref: string
  confidence: number
  partial?: boolean
}

/** Fast exact-pattern detection. No API cost. */
export function detectVerseRegex(text: string): DetectionResult | null {
  const m = normalizeSpokenNumbers(text).match(VERSE_RE)
  if (!m) return null
  return { ref: `${canonicaliseBook(m[1])} ${m[2]}:${m[3]}`, confidence: 96 }
}

/** Looser detection that tolerates mangled book names from speech-to-text. */
export function detectVerseFuzzy(text: string): DetectionResult | null {
  const pat = /\b([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(?:chapter\s+)?(\d+)(?::|,?\s+verse\s+)(\d+)/gi
  let m: RegExpExecArray | null
  while ((m = pat.exec(text)) !== null) {
    const book = fuzzyMatchBook(m[1].trim())
    if (book) {
      return { ref: `${canonicaliseBook(book)} ${m[2]}:${m[3]}`, confidence: 82 }
    }
  }
  return null
}

/** Every distinct reference present in a block of text, in order of appearance. */
export function extractAllVerseRefs(text: string): string[] {
  const pat = new RegExp(VERSE_RE_G.source, VERSE_RE_G.flags)
  const norm = normalizeSpokenNumbers(text)
  const refs: string[] = []
  const seen = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = pat.exec(norm)) !== null) {
    const ref = `${canonicaliseBook(m[1])} ${m[2]}:${m[3]}`
    if (!seen.has(ref)) {
      seen.add(ref)
      refs.push(ref)
    }
  }
  return refs
}

// ── Context memory ───────────────────────────────────────────────────────────
// Lets "verse 10" resolve when the speaker already named the book and chapter.

export interface RefContext {
  book: string | null
  chapter: string | null
}

export function updateContext(ctx: RefContext, ref: string): RefContext {
  const m = ref.match(/^(.+?)\s+(\d+):\d+$/)
  return m ? { book: m[1], chapter: m[2] } : ctx
}

export function resolvePartialRef(
  text: string,
  ctx: RefContext
): { result: DetectionResult | null; ctx: RefContext } {
  // "verse N" alone
  const vs = /\bverse\s+(\d+)\b/i.exec(text)
  if (vs && ctx.book && ctx.chapter) {
    return {
      result: { ref: `${ctx.book} ${ctx.chapter}:${vs[1]}`, confidence: 80, partial: true },
      ctx,
    }
  }
  // "chapter N verse N" with no book named
  const cv = /\bchapter\s+(\d+)\s+verse\s+(\d+)\b/i.exec(text)
  if (cv && ctx.book) {
    return {
      result: { ref: `${ctx.book} ${cv[1]}:${cv[2]}`, confidence: 76, partial: true },
      ctx,
    }
  }
  // "chapter N" alone — remember it so a following "verse N" resolves
  const ch = /\bchapter\s+(\d+)\b/i.exec(text)
  if (ch && ctx.book) {
    return { result: null, ctx: { ...ctx, chapter: ch[1] } }
  }
  return { result: null, ctx }
}
