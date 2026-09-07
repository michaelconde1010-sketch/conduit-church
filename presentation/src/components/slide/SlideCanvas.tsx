import { useThemeStore } from '../../stores/themeStore'
import { usePresentationStore } from '../../stores/presentationStore'
import { useMediaStore } from '../../stores/mediaStore'
import { SlideRenderer } from './SlideRenderer'

interface Props {
  mode: 'preview' | 'live'
  /** Optional label shown above the canvas */
  label?: string
}

export function SlideCanvas({ mode, label }: Props) {
  const theme = useThemeStore((s) => s.theme)
  const preview = usePresentationStore((s) => s.preview)
  const live = usePresentationStore((s) => s.live)
  const isFrozen = usePresentationStore((s) => s.isFrozen)

  const staged = mode === 'preview' ? preview : live
  const isLive = mode === 'live'

  // Resolve an image background (per-verse override wins over the theme)
  const bg = staged?.overrides?.background ?? theme.background
  const library = useMediaStore((s) => s.library)
  const bgImageSrc =
    bg.type === 'image' && bg.imageId
      ? library.find((m) => m.id === bg.imageId)?.src ?? null
      : null

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-[4px] uppercase text-white/35 font-medium">
            {label}
          </span>
          {isLive && live && (
            <span className="text-[9px] tracking-widest uppercase text-[#4caf7d] font-semibold">
              ● Live
            </span>
          )}
          {isLive && isFrozen && (
            <span className="text-[9px] tracking-widest uppercase text-amber-400 font-semibold">
              ⏸ Frozen
            </span>
          )}
        </div>
      )}

      <div
        className="rounded-lg overflow-hidden"
        style={{
          border: isLive && live
            ? '1px solid rgba(76,175,125,0.35)'
            : '1px solid rgba(255,255,255,0.08)',
          boxShadow: isLive && live
            ? '0 0 0 1px rgba(76,175,125,0.1), 0 8px 32px rgba(0,0,0,0.6)'
            : '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <SlideRenderer
          verse={staged?.verse ?? null}
          theme={theme}
          overrides={staged?.overrides}
          bgImageSrc={bgImageSrc}
        />
      </div>
    </div>
  )
}
