import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme, Preset } from '../types/theme'

const darkMinimal: Theme = {
  id: 'dark-minimal',
  name: 'Dark Minimal',
  bodyFont: { family: 'Cormorant Garamond', size: 5.5, color: '#ffffff', weight: 300 },
  refFont: { family: 'Cinzel', size: 2, color: '#c9a84c', weight: 400 },
  textAlign: 'center',
  textShadow: true,
  padding: { x: 8, y: 6 },
  background: {
    type: 'solid',
    color: '#0a0a0f',
    gradient: { from: '#0a0a0f', to: '#1a1a2e', direction: '135deg' },
    imageId: null,
  },
  translation: 'KJV',
  lowerThird: { enabled: false, barOpacity: 0.85 },
  transition: 'fade',
}

const lightClean: Theme = {
  ...darkMinimal,
  id: 'light-clean',
  name: 'Light Clean',
  bodyFont: { family: 'Cormorant Garamond', size: 5.5, color: '#1a1a22', weight: 400 },
  refFont: { family: 'Cinzel', size: 2, color: '#9a7c2e', weight: 400 },
  textShadow: false,
  background: {
    type: 'solid',
    color: '#f5f4ef',
    gradient: { from: '#f5f4ef', to: '#e8e4d9', direction: '135deg' },
    imageId: null,
  },
}

const boldWorship: Theme = {
  ...darkMinimal,
  id: 'bold-worship',
  name: 'Bold Worship',
  bodyFont: { family: 'Cinzel', size: 5, color: '#ffffff', weight: 700 },
  refFont: { family: 'Cinzel', size: 1.8, color: '#c9a84c', weight: 400 },
  background: {
    type: 'gradient',
    color: '#0a0a1e',
    gradient: { from: '#0a0a1e', to: '#1a0808', direction: '150deg' },
    imageId: null,
  },
}

const BUILT_IN_PRESETS: Preset[] = [
  { id: 'dark-minimal', name: 'Dark Minimal', theme: darkMinimal, builtIn: true },
  { id: 'light-clean', name: 'Light Clean', theme: lightClean, builtIn: true },
  { id: 'bold-worship', name: 'Bold Worship', theme: boldWorship, builtIn: true },
]

interface ThemeStore {
  theme: Theme
  presets: Preset[]
  setTheme: (updates: Partial<Theme>) => void
  savePreset: (name: string) => void
  loadPreset: (id: string) => void
  deletePreset: (id: string) => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: darkMinimal,
      presets: BUILT_IN_PRESETS,

      setTheme: (updates) =>
        set((s) => ({ theme: { ...s.theme, ...updates } })),

      savePreset: (name) => {
        const id = `custom-${Date.now()}`
        const preset: Preset = {
          id,
          name,
          theme: { ...get().theme, id, name },
          builtIn: false,
        }
        set((s) => ({ presets: [...s.presets, preset] }))
      },

      loadPreset: (id) => {
        const preset = get().presets.find((p) => p.id === id)
        if (preset) set({ theme: { ...preset.theme } })
      },

      deletePreset: (id) =>
        set((s) => ({ presets: s.presets.filter((p) => p.builtIn || p.id !== id) })),
    }),
    {
      name: 'conduit-theme',
      partialize: (s) => ({ theme: s.theme, presets: s.presets.filter((p) => !p.builtIn) }),
      merge: (persisted, current) => {
        const p = persisted as Partial<ThemeStore>
        return {
          ...current,
          theme: p.theme ?? current.theme,
          presets: [...BUILT_IN_PRESETS, ...(p.presets ?? [])],
        }
      },
    }
  )
)
