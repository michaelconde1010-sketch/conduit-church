// AI verse detection — catches paraphrases and nicknames that regex can't
// ("the eagle verse" → Isaiah 40:31).
//
// The Anthropic key lives in the ANTHROPIC_API_KEY env var on Netlify and is
// never sent to the browser. All calls go through /.netlify/functions/detect.
//
// Locally this needs `netlify dev` running on port 8888 — vite.config.ts proxies
// /.netlify/* there. Without it, AI detection reports itself as unavailable and
// regex detection carries on working.

import type { DetectionResult } from './detection'

export type AiStatus = 'unknown' | 'ready' | 'unconfigured' | 'rate_limited' | 'error'

export interface AiDetectOutcome {
  result: DetectionResult | null
  status: AiStatus
  /** Operator-facing explanation, set when status is not 'ready' */
  message?: string
}

export async function detectVerseWithAI(
  transcript: string,
  confThreshold: number,
  sermonPlan: string[] = []
): Promise<AiDetectOutcome> {
  try {
    const res = await fetch('/.netlify/functions/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, confThreshold, sermonPlan }),
    })

    // The dev server returns index.html for unknown paths, so a non-JSON body
    // means the function isn't running rather than a genuine API failure.
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      return {
        result: null,
        status: 'unconfigured',
        message: 'AI detection needs `netlify dev` running alongside the app.',
      }
    }

    const data = await res.json() as {
      ref?: string | null
      confidence?: number
      error?: string
      code?: string
    }

    if (!res.ok) {
      if (data.code === 'not_configured') {
        return {
          result: null,
          status: 'unconfigured',
          message: 'AI detection is not configured — set ANTHROPIC_API_KEY on the server.',
        }
      }
      if (res.status === 429) {
        return {
          result: null,
          status: 'rate_limited',
          message: data.error ?? 'AI detection is rate limited. Try again shortly.',
        }
      }
      return {
        result: null,
        status: 'error',
        message: data.error ?? 'AI detection failed.',
      }
    }

    if (!data.ref) return { result: null, status: 'ready' }

    return {
      result: { ref: data.ref, confidence: data.confidence ?? confThreshold },
      status: 'ready',
    }
  } catch (e) {
    console.warn('AI detect error:', e)
    return {
      result: null,
      status: 'error',
      message: 'Could not reach AI detection — check your connection.',
    }
  }
}
