import { useState } from 'react'
import { usePresentationStore } from '../../stores/presentationStore'
import { useThemeStore } from '../../stores/themeStore'

export function SlideEditor() {
  const preview = usePresentationStore((s) => s.preview)
  const updateOverride = usePresentationStore((s) => s.updateOverride)
  const bodyFontSize = useThemeStore((s) => s.theme.bodyFont.size)
  const [open, setOpen] = useState(false)

  if (!preview) return null

  const overrides = preview.overrides ?? {}
  const currentText = overrides.editedText ?? preview.verse.text
  const currentSize = overrides.bodyFontSize ?? bodyFontSize

  function reset() {
    updateOverride('editedText', undefined)
    updateOverride('bodyFontSize', undefined)
    updateOverride('background', undefined)
  }

  const hasOverrides =
    overrides.editedText !== undefined ||
    overrides.bodyFontSize !== undefined ||
    overrides.background !== undefined

  return (
    <div className="border-t border-white/8">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-[11px] text-white/40 hover:text-white/60 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          {open ? '▾' : '▸'} Edit verse
          {hasOverrides && (
            <span className="text-[9px] bg-gold/15 text-gold border border-gold/30 rounded px-1.5 py-0.5 tracking-wide">
              EDITED
            </span>
          )}
        </span>
        {hasOverrides && !open && (
          <button
            onClick={(e) => { e.stopPropagation(); reset() }}
            className="text-[10px] text-white/30 hover:text-white/55 transition-colors"
          >
            Reset
          </button>
        )}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-4">
          {/* Text */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-white/50">Text</label>
            <textarea
              value={currentText}
              onChange={(e) => updateOverride('editedText', e.target.value || undefined)}
              rows={4}
              className="w-full bg-surface2 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white/80 placeholder:text-white/25 focus:outline-none focus:border-gold/40 resize-none leading-relaxed"
            />
            {overrides.editedText !== undefined && (
              <button
                onClick={() => updateOverride('editedText', undefined)}
                className="text-[10px] text-white/30 hover:text-white/55"
              >
                Restore original
              </button>
            )}
          </div>

          {/* Font size override */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-white/50">Font size</label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gold tabular-nums">{currentSize.toFixed(1)} cqw</span>
                {overrides.bodyFontSize !== undefined && (
                  <button
                    onClick={() => updateOverride('bodyFontSize', undefined)}
                    className="text-[10px] text-white/30 hover:text-white/55"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="14"
              step="0.1"
              value={currentSize}
              onChange={(e) => updateOverride('bodyFontSize', parseFloat(e.target.value))}
              className="w-full accent-gold h-1 cursor-pointer"
            />
          </div>

          {/* Reset all */}
          {hasOverrides && (
            <button
              onClick={reset}
              className="text-[11px] text-white/35 hover:text-white/60 transition-colors border border-white/10 rounded px-3 py-1.5 w-full"
            >
              Reset all overrides
            </button>
          )}
        </div>
      )}
    </div>
  )
}
