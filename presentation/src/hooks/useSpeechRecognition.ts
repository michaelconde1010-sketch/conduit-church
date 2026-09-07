import { useRef, useCallback, useEffect } from 'react'
import { useDetectionStore } from '../stores/detectionStore'
import { useThemeStore } from '../stores/themeStore'
import {
  extractAllVerseRefs, resolvePartialRef, updateContext, detectVerseFuzzy,
} from '../lib/detection'
import type { RefContext, DetectionResult } from '../lib/detection'
import { normalizeSpokenNumbers } from '../lib/bible'
import { detectVerseWithAI } from '../lib/aiDetect'
import { fetchVerse } from '../lib/fetchVerse'

// ── Web Speech API types (not in the standard TS DOM lib) ────────────────────
interface SpeechRecognitionAlternative { transcript: string }
interface SpeechRecognitionResult { 0: SpeechRecognitionAlternative; isFinal: boolean }
interface SpeechRecognitionResultList { length: number; [i: number]: SpeechRecognitionResult }
interface SpeechRecognitionEventLike { results: SpeechRecognitionResultList }
interface SpeechRecognitionErrorEventLike { error: string }
interface SpeechRecognitionLike {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function isSpeechSupported(): boolean {
  return getSpeechRecognition() !== null
}

const FETCH_DEBOUNCE_MS = 600
const AI_DEBOUNCE_MS = 1800
const MAX_REFS_PER_BATCH = 3
const TRANSCRIPT_CAP = 4000

export function useSpeechRecognition() {
  const recRef = useRef<SpeechRecognitionLike | null>(null)
  const listeningRef = useRef(false)
  const cumulativeRef = useRef('')
  const sessionTextRef = useRef('')
  const ctxRef = useRef<RefContext>({ book: null, chapter: null })
  const lastRefsRef = useRef<string>('')
  const lastAiRefRef = useRef<string | null>(null)
  const fetchTimerRef = useRef<number | null>(null)
  const aiTimerRef = useRef<number | null>(null)
  const restartTimerRef = useRef<number | null>(null)

  const stop = useCallback(() => {
    listeningRef.current = false
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current)
    try { recRef.current?.stop() } catch { /* already stopped */ }
    sessionTextRef.current = ''
    useDetectionStore.getState().setListening(false)
    useDetectionStore.getState().setAiThinking(false)
  }, [])

  const handleTranscript = useCallback(async (fullText: string) => {
    const store = useDetectionStore.getState()
    const translation = useThemeStore.getState().theme.translation
    const tNorm = normalizeSpokenNumbers(fullText)

    // Every explicit reference in the transcript so far
    const explicitRefs = extractAllVerseRefs(tNorm)

    // Fall back to context ("verse 10") then fuzzy book matching, which tolerates
    // speech-to-text mangling like "philipians 4:13".
    let partial: DetectionResult | null = null
    if (!explicitRefs.length) {
      const res = resolvePartialRef(tNorm, ctxRef.current)
      ctxRef.current = res.ctx
      partial = res.result ?? detectVerseFuzzy(tNorm)
    } else {
      ctxRef.current = updateContext(ctxRef.current, explicitRefs[0])
    }

    const allRefs = explicitRefs.length ? explicitRefs : partial ? [partial.ref] : []

    // Skip refs already showing in the feed or already actioned
    const newRefs = allRefs.filter(
      (r) => !store.handledRefs.has(r) && !store.detected.some((d) => d.ref === r)
    )

    // ── Debounced fetch — only fires when the incoming ref set changes ────────
    const refsKey = newRefs.join('|')
    if (refsKey !== lastRefsRef.current) {
      lastRefsRef.current = refsKey
      if (newRefs.length) {
        if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
        if (aiTimerRef.current) clearTimeout(aiTimerRef.current)
        fetchTimerRef.current = window.setTimeout(async () => {
          for (const ref of newRefs.slice(0, MAX_REFS_PER_BATCH)) {
            const isPartial = !explicitRefs.includes(ref) && !!partial
            const confidence = isPartial ? partial?.confidence ?? 82 : 96
            try {
              const verse = await fetchVerse(ref, translation, {
                confidence,
                source: 'speech',
              })
              useDetectionStore.getState().addDetected(verse)
            } catch {
              // Verse not found or offline — skip silently, the next utterance may fix it
            }
          }
        }, FETCH_DEBOUNCE_MS)
      }
    }

    // ── AI fallback — only when regex found nothing anywhere ─────────────────
    // Skipped once the server reports AI unavailable, so we don't retry every
    // utterance against an endpoint we know isn't there.
    if (!allRefs.length && store.aiStatus !== 'unconfigured') {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current)
      aiTimerRef.current = window.setTimeout(async () => {
        const s = useDetectionStore.getState()
        s.setAiThinking(true)
        const outcome = await detectVerseWithAI(tNorm, s.confThreshold, s.sermonPlan)

        const after = useDetectionStore.getState()
        after.setAiThinking(false)
        after.setAiStatus(outcome.status, outcome.message ?? null)

        const ai = outcome.result
        if (!ai?.ref) return

        const cur = useDetectionStore.getState()
        if (
          ai.ref === lastAiRefRef.current ||
          cur.handledRefs.has(ai.ref) ||
          cur.detected.some((d) => d.ref === ai.ref)
        ) return

        lastAiRefRef.current = ai.ref
        ctxRef.current = updateContext(ctxRef.current, ai.ref)
        try {
          const verse = await fetchVerse(ai.ref, translation, {
            confidence: ai.confidence,
            source: 'ai',
          })
          useDetectionStore.getState().addDetected(verse)
        } catch {
          // Ignore — AI guessed a reference the Bible API doesn't recognise
        }
      }, AI_DEBOUNCE_MS)
    }
  }, [])

  const start = useCallback(() => {
    const SR = getSpeechRecognition()
    const store = useDetectionStore.getState()

    if (!SR) {
      store.setMicError('Speech recognition needs Google Chrome or Microsoft Edge.')
      return
    }

    store.setMicError(null)

    const rec = new SR()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'

    rec.onresult = (e) => {
      let t = ''
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript
      sessionTextRef.current = t

      const fullText = (cumulativeRef.current
        ? `${cumulativeRef.current} ${t}`
        : t
      ).trim()

      // Keep the visible transcript to the most recent stretch
      const display = fullText.length > 1200 ? `…${fullText.slice(-1200)}` : fullText
      useDetectionStore.getState().setTranscript(display)

      void handleTranscript(fullText)
    }

    rec.onerror = (err) => {
      // Fatal — stop entirely
      if (err.error === 'not-allowed' || err.error === 'service-not-available') {
        const msg = err.error === 'not-allowed'
          ? 'Microphone access was blocked. Allow it in your browser’s site settings, then try again.'
          : 'Speech service unavailable. Check your internet connection.'
        useDetectionStore.getState().setMicError(msg)
        stop()
        return
      }
      // Recoverable (no-speech, aborted, network, audio-capture) — onend restarts us
    }

    rec.onend = () => {
      // Roll this session's text into the running transcript
      if (sessionTextRef.current.trim()) {
        cumulativeRef.current = (
          (cumulativeRef.current ? `${cumulativeRef.current} ` : '') + sessionTextRef.current
        ).trim().slice(-TRANSCRIPT_CAP)
        sessionTextRef.current = ''
      }
      if (!listeningRef.current) return

      // Short delay stops rapid-fire restarts throwing "aborted"
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current)
      restartTimerRef.current = window.setTimeout(() => {
        try {
          rec.start()
        } catch {
          setTimeout(() => { try { rec.start() } catch { /* give up this cycle */ } }, 500)
        }
      }, 250)
    }

    recRef.current = rec
    listeningRef.current = true

    try {
      rec.start()
      store.setListening(true)
    } catch {
      store.setMicError('Could not start the microphone. Close other tabs using it and try again.')
      listeningRef.current = false
    }
  }, [handleTranscript, stop])

  const toggle = useCallback(() => {
    if (listeningRef.current) stop()
    else start()
  }, [start, stop])

  const reset = useCallback(() => {
    cumulativeRef.current = ''
    sessionTextRef.current = ''
    ctxRef.current = { book: null, chapter: null }
    lastRefsRef.current = ''
    lastAiRefRef.current = null
    useDetectionStore.getState().clearDetections()
  }, [])

  // Stop the mic if the operator closes the tab
  useEffect(() => stop, [stop])

  return { start, stop, toggle, reset }
}
