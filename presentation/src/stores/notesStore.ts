import { create } from 'zustand'
import type { DetectedVerse } from '../types/verse'
import type { BibleTranslation } from '../types/theme'
import { extractText, ExtractError, KIND_PHRASES } from '../lib/documents'
import type { DocKind } from '../lib/documents'
import { extractAllVerseRefs } from '../lib/detection'
import { fetchVerse } from '../lib/fetchVerse'

export type NoteStatus = 'pending' | 'loading' | 'ready' | 'notfound'

export interface NoteEntry {
  ref: string
  status: NoteStatus
  verse: DetectedVerse | null
}

/** Plenty for a sermon; stops a mis-picked book from firing hundreds of requests. */
const MAX_REFS = 80
/** Small gap between fetches so we don't trip the Bible API's rate limit. */
const FETCH_GAP_MS = 120

interface NotesStore {
  fileName: string | null
  entries: NoteEntry[]
  parsing: boolean
  error: string | null
  /** Which format was detected, once extraction succeeds */
  kind: DocKind | null
  /** e.g. "Word document processed — 6 verses found" */
  summary: string | null
  /** Pages or slides in the source document, for the detail line */
  units: number
  unitLabel: string | null
  truncated: boolean
  /** Translation the current entries were fetched in */
  loadedTranslation: BibleTranslation | null

  loadFile: (file: File, translation: BibleTranslation) => Promise<void>
  refetch: (translation: BibleTranslation) => Promise<void>
  clear: () => void
}

const EMPTY = {
  entries: [] as NoteEntry[],
  kind: null,
  summary: null,
  units: 0,
  unitLabel: null,
  truncated: false,
  loadedTranslation: null,
} as const

let runToken = 0

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

export const useNotesStore = create<NotesStore>()((set, get) => ({
  fileName: null,
  parsing: false,
  error: null,
  ...EMPTY,

  loadFile: async (file, translation) => {
    const token = ++runToken
    set({ parsing: true, error: null, fileName: file.name, ...EMPTY })

    let result
    try {
      result = await extractText(file)
    } catch (e) {
      if (token !== runToken) return
      set({
        parsing: false,
        fileName: null,
        error: e instanceof ExtractError
          ? e.message
          : 'Could not read that file. Try a different export.',
      })
      return
    }
    if (token !== runToken) return

    const base = {
      parsing: false,
      kind: result.kind,
      units: result.units,
      unitLabel: result.unitLabel,
      truncated: result.truncated,
    }

    if (!result.text) {
      set({
        ...base,
        error: result.kind === 'pdf'
          ? 'No text found. If this PDF is a scan, it needs OCR before references can be picked up.'
          : `That ${KIND_PHRASES[result.kind]} appears to be empty.`,
      })
      return
    }

    const refs = extractAllVerseRefs(result.text).slice(0, MAX_REFS)
    if (!refs.length) {
      set({
        ...base,
        summary: `${result.label} processed — no verses found`,
        error: 'No verse references were found in that document.',
      })
      return
    }

    set({
      ...base,
      summary: `${result.label} processed — ${plural(refs.length, 'verse')} found`,
      loadedTranslation: translation,
      entries: refs.map((ref) => ({ ref, status: 'pending' as NoteStatus, verse: null })),
    })

    await get().refetch(translation)
  },

  refetch: async (translation) => {
    const token = runToken
    const refs = get().entries.map((e) => e.ref)

    for (const ref of refs) {
      if (token !== runToken) return

      set((s) => ({
        entries: s.entries.map((e) =>
          e.ref === ref ? { ...e, status: 'loading' as NoteStatus } : e
        ),
      }))

      let verse: DetectedVerse | null = null
      try {
        verse = await fetchVerse(ref, translation, { confidence: 100, source: 'manual' })
      } catch {
        verse = null
      }
      if (token !== runToken) return

      set((s) => ({
        loadedTranslation: translation,
        entries: s.entries.map((e) =>
          e.ref === ref ? { ...e, status: verse ? 'ready' : 'notfound', verse } : e
        ),
      }))

      await new Promise((r) => setTimeout(r, FETCH_GAP_MS))
    }
  },

  clear: () => {
    runToken++
    set({ fileName: null, parsing: false, error: null, ...EMPTY })
  },
}))
