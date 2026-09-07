import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface MediaItem {
  id: string
  name: string
  /** base64 data URI — self-contained so it survives a reload */
  src: string
  addedAt: number
}

export const MAX_MEDIA = 10
/** Images above this are rejected — localStorage caps out around 5 MB total. */
export const MAX_FILE_BYTES = 900_000

interface MediaStore {
  library: MediaItem[]
  logoSrc: string | null

  addMedia: (file: File) => Promise<{ ok: true } | { ok: false; error: string }>
  removeMedia: (id: string) => void
  setLogo: (src: string | null) => void
  getById: (id: string | null) => MediaItem | null
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(new Error('Could not read file'))
    r.readAsDataURL(file)
  })
}

export const useMediaStore = create<MediaStore>()(
  persist(
    (set, get) => ({
      library: [],
      logoSrc: null,

      addMedia: async (file) => {
        if (get().library.length >= MAX_MEDIA) {
          return { ok: false, error: `Library is full — remove one first (max ${MAX_MEDIA}).` }
        }
        if (!file.type.startsWith('image/')) {
          return { ok: false, error: 'That file isn’t an image.' }
        }
        if (file.size > MAX_FILE_BYTES) {
          const mb = (file.size / 1_000_000).toFixed(1)
          return { ok: false, error: `Image is ${mb} MB — keep it under 0.9 MB so it saves reliably.` }
        }
        try {
          const src = await readAsDataUrl(file)
          set((s) => ({
            library: [
              ...s.library,
              { id: `m-${Date.now()}`, name: file.name, src, addedAt: Date.now() },
            ],
          }))
          return { ok: true }
        } catch {
          return { ok: false, error: 'Could not read that file.' }
        }
      },

      removeMedia: (id) => set((s) => ({ library: s.library.filter((m) => m.id !== id) })),

      setLogo: (logoSrc) => set({ logoSrc }),

      getById: (id) => (id ? get().library.find((m) => m.id === id) ?? null : null),
    }),
    { name: 'conduit-media' }
  )
)
