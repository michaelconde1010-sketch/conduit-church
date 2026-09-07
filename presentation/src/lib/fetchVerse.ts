// Verse text retrieval. Bible text always comes from an API — never from an LLM.

import type { DetectedVerse } from '../types/verse'
import type { BibleTranslation } from '../types/theme'

export async function fetchVerse(
  ref: string,
  translation: BibleTranslation,
  meta: { confidence?: number; source?: DetectedVerse['source'] } = {}
): Promise<DetectedVerse> {
  const { confidence = 100, source = 'manual' } = meta

  // KJV comes straight from bible-api.com (free, no key).
  if (translation === 'KJV') {
    const r = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}?translation=kjv`)
    const data = await r.json() as { reference?: string; text?: string; error?: string }
    if (data.error || !data.text) throw new Error(data.error ?? 'Verse not found')
    return {
      id: `${ref}-${Date.now()}`,
      ref: data.reference ?? ref,
      text: data.text.replace(/\s+/g, ' ').trim(),
      translation: 'KJV',
      confidence,
      detectedAt: Date.now(),
      source,
    }
  }

  // Everything else goes through the Netlify proxy (keeps the Bible API key server-side).
  const params = new URLSearchParams({ ref, translation })
  const r = await fetch(`/.netlify/functions/bible?${params}`)
  const data = await r.json() as { ref?: string; text?: string; error?: string }
  if (!r.ok || data.error) throw new Error(data.error ?? `HTTP ${r.status}`)
  return {
    id: `${ref}-${Date.now()}`,
    ref: data.ref ?? ref,
    text: (data.text ?? '').trim(),
    translation,
    confidence,
    detectedAt: Date.now(),
    source,
  }
}
