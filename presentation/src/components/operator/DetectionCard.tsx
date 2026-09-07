import { useDetectionStore } from '../../stores/detectionStore'
import { usePresentationStore } from '../../stores/presentationStore'
import type { DetectedVerse } from '../../types/verse'

interface Props {
  verse: DetectedVerse
  colorIdx: number
}

// Gold → amber → green, matching the highlight palette in app.html
const ACCENTS = ['#c9a84c', '#e8a030', '#4caf7d']

export function DetectionCard({ verse, colorIdx }: Props) {
  const stageVerse = usePresentationStore((s) => s.stageVerse)
  const previewId = usePresentationStore((s) => s.preview?.verse.id)
  const dismissDetected = useDetectionStore((s) => s.dismissDetected)
  const markHandled = useDetectionStore((s) => s.markHandled)

  const accent = ACCENTS[colorIdx % ACCENTS.length]
  const isStaged = previewId === verse.id

  function handleStage() {
    stageVerse(verse)
    markHandled(verse.ref)
  }

  return (
    <div
      className="rounded-lg border transition-all group"
      style={{
        borderColor: isStaged ? `${accent}66` : 'rgba(255,255,255,0.08)',
        background: isStaged ? `${accent}12` : 'rgba(255,255,255,0.02)',
      }}
    >
      <button
        onClick={handleStage}
        className="w-full text-left px-3 pt-2.5 pb-2 cursor-pointer"
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="text-[12px] font-medium tracking-wide"
            style={{ color: accent }}
          >
            {verse.ref}
          </span>

          {verse.source === 'ai' && (
            <span className="text-[8px] tracking-[1.5px] uppercase px-1.5 py-0.5 rounded border border-white/15 text-white/40">
              AI
            </span>
          )}

          <span className="ml-auto text-[10px] text-white/25 tabular-nums">
            {verse.confidence}%
          </span>
        </div>

        <p className="text-[11px] text-white/45 leading-snug line-clamp-2">
          {verse.text}
        </p>
      </button>

      <div className="flex items-center gap-2 px-3 pb-2">
        <button
          onClick={handleStage}
          className="text-[10px] tracking-wide transition-colors"
          style={{ color: `${accent}cc` }}
        >
          {isStaged ? '✓ Staged' : 'Stage →'}
        </button>
        <button
          onClick={() => dismissDetected(verse.id)}
          className="ml-auto text-[10px] text-white/20 hover:text-white/50 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
