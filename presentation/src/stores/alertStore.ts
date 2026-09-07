import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AlertPosition = 'top' | 'center' | 'bottom'

export interface Alert {
  text: string
  position: AlertPosition
  /** Milliseconds on screen. 0 = stays until dismissed. */
  duration: number
}

interface AlertStore {
  current: Alert | null
  /** Reusable canned messages */
  saved: string[]

  setAlert: (a: Alert | null) => void
  addSaved: (text: string) => void
  removeSaved: (text: string) => void
}

const DEFAULT_SAVED = [
  'Please silence your phones',
  'Welcome — glad you’re here',
  'Offering will be collected shortly',
  'Children’s ministry is now dismissed',
]

export const useAlertStore = create<AlertStore>()(
  persist(
    (set) => ({
      current: null,
      saved: DEFAULT_SAVED,

      setAlert: (current) => set({ current }),

      addSaved: (text) =>
        set((s) => (s.saved.includes(text) ? {} : { saved: [...s.saved, text].slice(0, 20) })),

      removeSaved: (text) => set((s) => ({ saved: s.saved.filter((t) => t !== text) })),
    }),
    {
      name: 'conduit-alerts',
      partialize: (s) => ({ saved: s.saved }),
    }
  )
)
