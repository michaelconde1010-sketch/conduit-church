import { create } from 'zustand'
import type { DetectedVerse, StagedVerse } from '../types/verse'

interface PresentationStore {
  preview: StagedVerse | null
  live: StagedVerse | null
  isHeld: boolean
  isFrozen: boolean
  displayMode: 'fullscreen' | 'lowerthird'

  stageVerse: (verse: DetectedVerse) => void
  updateOverride: (field: string, value: unknown) => void
  sendToLive: () => void
  clearScreen: () => void
  toggleHold: () => void
  toggleFreeze: () => void
  setDisplayMode: (mode: 'fullscreen' | 'lowerthird') => void
}

export const usePresentationStore = create<PresentationStore>()((set, get) => ({
  preview: null,
  live: null,
  isHeld: false,
  isFrozen: false,
  displayMode: 'fullscreen',

  stageVerse: (verse) => set({ preview: { verse } }),

  updateOverride: (field, value) =>
    set((s) =>
      s.preview
        ? { preview: { ...s.preview, overrides: { ...s.preview.overrides, [field]: value } } }
        : {}
    ),

  sendToLive: () => {
    const { preview, isFrozen } = get()
    if (!preview || isFrozen) return
    set({ live: preview })
  },

  clearScreen: () => set({ live: null }),

  toggleHold: () => set((s) => ({ isHeld: !s.isHeld })),

  toggleFreeze: () => set((s) => ({ isFrozen: !s.isFrozen })),

  setDisplayMode: (mode) => set({ displayMode: mode }),
}))
