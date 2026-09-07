import { useState } from 'react'
import { useDetectionStore } from '../../stores/detectionStore'
import { useSpeechRecognition, isSpeechSupported } from '../../hooks/useSpeechRecognition'
import { DetectionCard } from './DetectionCard'

export function DetectionFeed() {
  const listening = useDetectionStore((s) => s.listening)
  const transcript = useDetectionStore((s) => s.transcript)
  const detected = useDetectionStore((s) => s.detected)
  const aiThinking = useDetectionStore((s) => s.aiThinking)
  const micError = useDetectionStore((s) => s.micError)
  const aiStatus = useDetectionStore((s) => s.aiStatus)
  const aiMessage = useDetectionStore((s) => s.aiMessage)

  const { toggle, reset } = useSpeechRecognition()
  const [showTranscript, setShowTranscript] = useState(true)

  const supported = isSpeechSupported()

  return (
    <div className="flex flex-col h-full">
      {/* Status strip */}
      {(aiThinking || detected.length > 0) && (
        <div className="px-3 py-1.5 border-b border-white/8 flex items-center gap-2 h-7">
          {aiThinking && (
            <span className="text-[9px] text-white/30 tracking-wide animate-pulse">
              thinking…
            </span>
          )}
          {detected.length > 0 && (
            <button
              onClick={reset}
              className="ml-auto text-[10px] text-white/25 hover:text-white/55 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Mic control */}
      <div className="p-3 border-b border-white/8 space-y-2">
        <button
          onClick={toggle}
          disabled={!supported}
          className={`w-full py-2 rounded-lg text-[12px] font-medium border transition-all flex items-center justify-center gap-2 ${
            !supported
              ? 'border-white/8 text-white/20 cursor-not-allowed'
              : listening
              ? 'bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/18'
              : 'bg-gold/8 border-gold/35 text-gold hover:bg-gold/16'
          }`}
        >
          {listening ? (
            <>
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              Stop Listening
            </>
          ) : (
            <>🎙 Start Listening</>
          )}
        </button>

        {!supported && (
          <p className="text-[10px] text-white/30 leading-relaxed">
            Speech recognition needs Chrome or Edge.
          </p>
        )}

        {micError && (
          <p className="text-[10px] text-red-400/80 leading-relaxed">{micError}</p>
        )}

        {supported && aiStatus !== 'ready' && aiMessage && (
          <p className="text-[10px] text-white/28 leading-relaxed">
            {aiMessage} Direct references still work.
          </p>
        )}
      </div>

      {/* Transcript */}
      {listening && (
        <div className="border-b border-white/8">
          <button
            onClick={() => setShowTranscript((v) => !v)}
            className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-white/30 hover:text-white/55 transition-colors"
          >
            {showTranscript ? '▾' : '▸'} Transcript
          </button>
          {showTranscript && (
            <div className="px-3 pb-2.5 max-h-28 overflow-y-auto">
              <p className="text-[10px] text-white/35 leading-relaxed">
                {transcript || <span className="text-white/18">Listening…</span>}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {detected.length === 0 ? (
          <div className="text-center py-8 px-3">
            <p className="text-[11px] text-white/22 leading-relaxed">
              {listening
                ? 'Verses will appear here as they’re mentioned.'
                : 'Start listening, or type a reference on the right.'}
            </p>
          </div>
        ) : (
          detected.map((v, i) => (
            <DetectionCard key={v.id} verse={v} colorIdx={i} />
          ))
        )}
      </div>
    </div>
  )
}
