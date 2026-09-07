import { useState, useRef, useEffect } from 'react'
import { SlideCanvas } from '../slide/SlideCanvas'
import { SlideEditor } from '../slide/SlideEditor'
import { usePresentationStore } from '../../stores/presentationStore'
import { useThemeStore } from '../../stores/themeStore'
import { useBroadcastSend } from '../../hooks/useBroadcast'
import { BOOKS } from '../../lib/bible'
import { fetchVerse } from '../../lib/fetchVerse'

// Numbered books also match without the leading number, so typing "cor"
// surfaces 1 and 2 Corinthians.
function getSuggestions(query: string): string[] {
  const q = query.trim().toLowerCase()
  // Only suggest while the book name is still being typed
  if (!q || /\d/.test(q)) return []
  return BOOKS.filter((b) => {
    const lower = b.toLowerCase()
    if (lower.startsWith(q)) return true
    const stem = lower.replace(/^\d+\s+/, '')
    return stem.startsWith(q)
  })
}

export function PreviewPanel() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const stageVerse = usePresentationStore((s) => s.stageVerse)
  const sendToLive = usePresentationStore((s) => s.sendToLive)
  const preview = usePresentationStore((s) => s.preview)
  const isFrozen = usePresentationStore((s) => s.isFrozen)
  const theme = useThemeStore((s) => s.theme)
  const send = useBroadcastSend()

  const suggestions = getSuggestions(query)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Open dropdown whenever there are suggestions
  useEffect(() => {
    setDropdownOpen(suggestions.length > 0)
  }, [suggestions.length])

  function handleSelect(book: string) {
    setQuery(book + ' ')
    setDropdownOpen(false)
    inputRef.current?.focus()
  }

  async function handleFetch() {
    const q = query.trim()
    if (!q) return
    setDropdownOpen(false)
    setLoading(true)
    setError(null)
    try {
      const verse = await fetchVerse(q, theme.translation, { source: 'manual' })
      stageVerse(verse)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verse not found — check the reference')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value
    // Auto-insert colon when user presses Space after a chapter number
    // e.g. "Matthew 5 " → "Matthew 5:"
    if (!val.includes(':')) {
      const match = val.match(/^(.*?\s)(\d+)\s$/)
      if (match) val = match[1] + match[2] + ':'
    }
    setQuery(val)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { handleFetch(); return }
    if (e.key === 'Escape') setDropdownOpen(false)
  }

  function handleSendToLive() {
    if (!preview || isFrozen) return
    sendToLive()
    send({ type: 'VERSE_LIVE', staged: preview, theme })
  }

  return (
    <div className="flex flex-col gap-3 flex-1 min-w-0">
      <SlideCanvas mode="preview" label="Preview" />

      {/* Verse input + autocomplete */}
      <div ref={wrapperRef} className="relative flex gap-2">
        <div className="relative flex-1 min-w-0">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (suggestions.length > 0) setDropdownOpen(true) }}
            placeholder="matthew 5:9  ·  john 3:16  ·  psalm 23:1"
            autoComplete="off"
            className="w-full bg-surface2 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-gold/40"
          />

          {/* Dropdown */}
          {dropdownOpen && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface2 border border-white/12 rounded-lg overflow-hidden shadow-2xl z-50">
              {suggestions.map((book) => (
                <button
                  key={book}
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(book) }}
                  className="w-full text-left px-3 py-2 text-[12px] text-white/75 hover:bg-white/6 hover:text-white transition-colors border-b border-white/6 last:border-0"
                >
                  {book}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleFetch}
          disabled={loading || !query.trim()}
          className={`px-3 py-2 rounded-lg text-[12px] font-medium border transition-all flex-shrink-0 ${
            loading
              ? 'border-white/10 text-white/25 bg-surface2'
              : query.trim()
              ? 'border-gold/35 text-gold bg-gold/8 hover:bg-gold/15'
              : 'border-white/8 text-white/20 bg-surface2 cursor-not-allowed'
          }`}
        >
          {loading ? '…' : 'Fetch'}
        </button>
      </div>

      {error && <p className="text-[11px] text-red-400/80">{error}</p>}

      {/* Slide editor (per-verse overrides) */}
      <div className="bg-surface2 rounded-lg overflow-hidden border border-white/8">
        <SlideEditor />
      </div>

      {/* Send to Live */}
      <button
        onClick={handleSendToLive}
        disabled={!preview || isFrozen}
        className={`w-full py-2.5 rounded-lg text-[13px] font-medium tracking-wide border transition-all ${
          preview && !isFrozen
            ? 'bg-[#4caf7d]/12 border-[#4caf7d]/40 text-[#4caf7d] hover:bg-[#4caf7d]/20'
            : 'bg-surface2 border-white/8 text-white/20 cursor-not-allowed'
        }`}
      >
        {isFrozen ? '⏸ Frozen — unfreeze to send' : 'Send to Live ▶'}
      </button>
    </div>
  )
}
