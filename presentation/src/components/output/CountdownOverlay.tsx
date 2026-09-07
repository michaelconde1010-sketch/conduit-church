import { useState, useEffect, useCallback } from 'react'

interface Props {
  initialSeconds: number
  onDone: () => void
}

export function CountdownOverlay({ initialSeconds, onDone }: Props) {
  const [remaining, setRemaining] = useState(initialSeconds)

  const handleDone = useCallback(onDone, [onDone])

  useEffect(() => {
    setRemaining(initialSeconds)
  }, [initialSeconds])

  useEffect(() => {
    if (remaining <= 0) {
      handleDone()
      return
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(t)
  }, [remaining, handleDone])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const display = mins > 0 ? `${mins}:${String(secs).padStart(2, '0')}` : String(secs)
  const urgent = remaining <= 10

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.72)',
      }}
    >
      <div
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(48px, 18vh, 260px)',
          fontWeight: 400,
          color: urgent ? '#e85858' : '#c9a84c',
          lineHeight: 1,
          letterSpacing: '0.05em',
          textShadow: `0 0 60px ${urgent ? 'rgba(232,88,88,0.4)' : 'rgba(201,168,76,0.4)'}`,
          transition: 'color 0.3s, text-shadow 0.3s',
        }}
      >
        {display}
      </div>
      <div
        style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 'clamp(10px, 1.8vh, 28px)',
          color: 'rgba(255,255,255,0.28)',
          letterSpacing: '6px',
          textTransform: 'uppercase',
          marginTop: '2vh',
        }}
      >
        Service begins soon
      </div>
    </div>
  )
}
