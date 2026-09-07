import { useState } from 'react'
import { DetectionFeed } from './DetectionFeed'
import { NotesPanel } from './NotesPanel'
import { useDetectionStore } from '../../stores/detectionStore'
import { useNotesStore } from '../../stores/notesStore'

type Tab = 'detection' | 'notes'

export function LeftRail() {
  const [tab, setTab] = useState<Tab>('detection')

  const detectedCount = useDetectionStore((s) => s.detected.length)
  const listening = useDetectionStore((s) => s.listening)
  const noteEntries = useNotesStore((s) => s.entries)
  const parsing = useNotesStore((s) => s.parsing)

  const notesReady = noteEntries.filter((e) => e.status === 'ready').length

  const tabs: Array<{ id: Tab; label: string; badge: string | null; pulse: boolean }> = [
    {
      id: 'detection',
      label: 'Detection',
      badge: detectedCount > 0 ? String(detectedCount) : null,
      pulse: listening,
    },
    {
      id: 'notes',
      label: 'Notes',
      badge: notesReady > 0 ? String(notesReady) : null,
      pulse: parsing,
    },
  ]

  return (
    <div className="w-[260px] flex-shrink-0 border-r border-white/8 flex flex-col bg-surface">
      {/* Tabs */}
      <div className="flex border-b border-white/8 flex-shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] tracking-[2px] uppercase transition-all border-b-2 ${
              tab === t.id
                ? 'text-gold border-gold'
                : 'text-white/30 border-transparent hover:text-white/55'
            }`}
          >
            {t.pulse && (
              <span
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  tab === t.id ? 'bg-gold' : 'bg-white/30'
                }`}
              />
            )}
            {t.label}
            {t.badge && (
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full tabular-nums ${
                  tab === t.id ? 'bg-gold/18 text-gold' : 'bg-white/8 text-white/40'
                }`}
              >
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Panel — both stay mounted so the mic keeps running while you read notes */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className={`h-full ${tab === 'detection' ? '' : 'hidden'}`}>
          <DetectionFeed />
        </div>
        <div className={`h-full ${tab === 'notes' ? '' : 'hidden'}`}>
          <NotesPanel />
        </div>
      </div>
    </div>
  )
}
