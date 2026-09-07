import { SlideCanvas } from '../slide/SlideCanvas'
import { usePresentationStore } from '../../stores/presentationStore'

export function LivePanel() {
  const clearScreen = usePresentationStore((s) => s.clearScreen)
  const live = usePresentationStore((s) => s.live)

  return (
    <div className="flex flex-col gap-3 flex-1 min-w-0">
      <SlideCanvas mode="live" label="Live" />

      <button
        onClick={clearScreen}
        disabled={!live}
        className={`w-full py-2.5 rounded-lg text-[13px] font-medium border transition-all ${
          live
            ? 'border-red-500/30 text-red-400/80 hover:bg-red-500/8 hover:border-red-500/45 hover:text-red-400'
            : 'border-white/6 text-white/18 cursor-not-allowed'
        }`}
      >
        Clear Screen
      </button>
    </div>
  )
}
