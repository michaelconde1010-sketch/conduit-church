import { useRef, useState } from 'react'
import { useNotesStore } from '../../stores/notesStore'
import { usePresentationStore } from '../../stores/presentationStore'
import { useThemeStore } from '../../stores/themeStore'
import type { NoteEntry } from '../../stores/notesStore'

const STATUS_DOT: Record<NoteEntry['status'], string> = {
  pending: 'rgba(255,255,255,0.14)',
  loading: '#c9a84c',
  ready: '#4caf7d',
  notfound: '#e85858',
}

function NoteRow({ entry }: { entry: NoteEntry }) {
  const stageVerse = usePresentationStore((s) => s.stageVerse)
  const previewId = usePresentationStore((s) => s.preview?.verse.id)

  const ready = entry.status === 'ready' && entry.verse
  const isStaged = ready && previewId === entry.verse!.id

  return (
    <button
      onClick={() => ready && stageVerse(entry.verse!)}
      disabled={!ready}
      className={`w-full text-left rounded-lg border px-2.5 py-2 transition-all ${
        isStaged
          ? 'bg-gold/10 border-gold/45'
          : ready
          ? 'bg-white/[0.02] border-white/8 hover:border-white/20 hover:bg-white/5'
          : 'bg-transparent border-white/6 cursor-default'
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            entry.status === 'loading' ? 'animate-pulse' : ''
          }`}
          style={{ background: STATUS_DOT[entry.status] }}
        />
        <span
          className={`text-[11px] font-medium tracking-wide flex-1 truncate ${
            ready ? 'text-gold' : 'text-white/35'
          }`}
        >
          {entry.ref}
        </span>
        {isStaged && <span className="text-[9px] text-gold/80 flex-shrink-0">staged</span>}
        {entry.status === 'notfound' && (
          <span className="text-[9px] text-red-400/60 flex-shrink-0">not found</span>
        )}
      </div>

      {ready && (
        <p className="text-[10px] text-white/32 leading-snug mt-1 line-clamp-2">
          {entry.verse!.text}
        </p>
      )}
    </button>
  )
}

export function NotesPanel() {
  const { fileName, entries, parsing, error, summary, units, unitLabel, truncated,
    loadedTranslation, loadFile, refetch, clear } = useNotesStore()
  const translation = useThemeStore((s) => s.theme.translation)
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const readyCount = entries.filter((e) => e.status === 'ready').length
  const settled = entries.filter((e) => e.status === 'ready' || e.status === 'notfound').length
  const done = entries.length > 0 && settled === entries.length
  const staleTranslation =
    loadedTranslation !== null && loadedTranslation !== translation && done

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    void loadFile(file, translation)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="flex flex-col h-full">
      {/* Upload zone */}
      <div className="p-3 border-b border-white/8 space-y-2">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.pptx,.txt,.md,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        {!fileName ? (
          <button
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              handleFiles(e.dataTransfer.files)
            }}
            className={`w-full py-7 rounded-lg border border-dashed text-[11px] transition-all ${
              dragOver
                ? 'border-gold/55 text-gold bg-gold/5'
                : 'border-white/15 text-white/40 hover:border-gold/35 hover:text-gold/80'
            }`}
          >
            <span className="block text-[15px] mb-1">📄</span>
            Drop the sermon notes here
            <span className="block text-[10px] text-white/22 mt-1">
              PDF, Word, PowerPoint or text
            </span>
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-white/60 truncate flex-1" title={fileName}>
                {fileName}
              </span>
              <button
                onClick={clear}
                className="text-[10px] text-white/25 hover:text-white/60 transition-colors flex-shrink-0"
              >
                Clear
              </button>
            </div>

            {parsing ? (
              <p className="text-[10px] text-gold/70 animate-pulse">Reading document…</p>
            ) : (
              <>
                {summary && (
                  <p className="text-[10px] text-gold/80 leading-relaxed">{summary}</p>
                )}
                {entries.length > 0 && (
                  <p className="text-[10px] text-white/35 tabular-nums">
                    {readyCount} of {entries.length} loaded
                    {unitLabel && units > 0 &&
                      ` · ${units} ${unitLabel}${units === 1 ? '' : 's'}`}
                    {truncated && ` (first ${units})`}
                  </p>
                )}
              </>
            )}

            {!parsing && (
              <button
                onClick={() => fileRef.current?.click()}
                className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
              >
                Load a different file
              </button>
            )}
          </div>
        )}

        {error && (
          <p className="text-[10px] text-red-400/75 leading-relaxed">{error}</p>
        )}

        {staleTranslation && (
          <button
            onClick={() => void refetch(translation)}
            className="w-full py-1.5 rounded text-[10px] border border-gold/35 text-gold/85 hover:bg-gold/10 transition-all"
          >
            Reload in {translation}
          </button>
        )}
      </div>

      {/* Extracted references */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {entries.length === 0 && !parsing && !error && (
          <div className="text-center py-8 px-3">
            <p className="text-[11px] text-white/22 leading-relaxed">
              Drop in the sermon notes as a PDF, Word document, or PowerPoint deck. Every
              verse referenced gets pulled out and pre-loaded, ready to put on screen in
              one click.
            </p>
          </div>
        )}

        {entries.map((e) => (
          <NoteRow key={e.ref} entry={e} />
        ))}
      </div>
    </div>
  )
}
