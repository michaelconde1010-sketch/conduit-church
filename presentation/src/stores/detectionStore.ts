import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DetectedVerse } from '../types/verse'
import type { AiStatus } from '../lib/aiDetect'

interface DetectionStore {
  // Settings (persisted)
  confThreshold: number
  sermonPlan: string[]

  // Session state (not persisted)
  listening: boolean
  transcript: string
  detected: DetectedVerse[]
  /** Refs already actioned (staged or dismissed) — stops them re-appearing */
  handledRefs: Set<string>
  aiThinking: boolean
  aiStatus: AiStatus
  aiMessage: string | null
  micError: string | null

  setConfThreshold: (n: number) => void
  setSermonPlan: (refs: string[]) => void

  setListening: (b: boolean) => void
  setTranscript: (t: string) => void
  setAiThinking: (b: boolean) => void
  setAiStatus: (status: AiStatus, message?: string | null) => void
  setMicError: (e: string | null) => void

  addDetected: (v: DetectedVerse) => void
  markHandled: (ref: string) => void
  dismissDetected: (id: string) => void
  clearDetections: () => void
}

export const useDetectionStore = create<DetectionStore>()(
  persist(
    (set) => ({
      confThreshold: 75,
      sermonPlan: [],

      listening: false,
      transcript: '',
      detected: [],
      handledRefs: new Set<string>(),
      aiThinking: false,
      aiStatus: 'unknown',
      aiMessage: null,
      micError: null,

      setConfThreshold: (confThreshold) => set({ confThreshold }),
      setSermonPlan: (sermonPlan) => set({ sermonPlan }),

      setListening: (listening) => set({ listening }),
      setTranscript: (transcript) => set({ transcript }),
      setAiThinking: (aiThinking) => set({ aiThinking }),
      setAiStatus: (aiStatus, aiMessage = null) => set({ aiStatus, aiMessage }),
      setMicError: (micError) => set({ micError }),

      addDetected: (v) =>
        set((s) =>
          s.detected.some((d) => d.ref === v.ref) || s.handledRefs.has(v.ref)
            ? {}
            : { detected: [v, ...s.detected].slice(0, 30) }
        ),

      markHandled: (ref) =>
        set((s) => {
          const next = new Set(s.handledRefs)
          next.add(ref)
          return { handledRefs: next }
        }),

      dismissDetected: (id) =>
        set((s) => {
          const target = s.detected.find((d) => d.id === id)
          const next = new Set(s.handledRefs)
          if (target) next.add(target.ref)
          return { detected: s.detected.filter((d) => d.id !== id), handledRefs: next }
        }),

      clearDetections: () =>
        set({ detected: [], handledRefs: new Set<string>(), transcript: '' }),
    }),
    {
      name: 'conduit-detection',
      version: 2,
      // v1 stored an apiKey in localStorage. The key now lives server-side, so
      // drop it on load rather than leaving it sitting in the browser.
      migrate: (persisted) => {
        const p = (persisted ?? {}) as Record<string, unknown>
        return {
          confThreshold: typeof p.confThreshold === 'number' ? p.confThreshold : 75,
          sermonPlan: Array.isArray(p.sermonPlan) ? (p.sermonPlan as string[]) : [],
        }
      },
      // Only settings persist — session state resets each load
      partialize: (s) => ({
        confThreshold: s.confThreshold,
        sermonPlan: s.sermonPlan,
      }),
    }
  )
)
