import { useEffect } from 'react'
import type { Alert } from '../../stores/alertStore'

interface Props {
  alert: Alert
  onExpire: () => void
}

export function AlertOverlay({ alert, onExpire }: Props) {
  useEffect(() => {
    if (alert.duration <= 0) return
    const t = setTimeout(onExpire, alert.duration)
    return () => clearTimeout(t)
  }, [alert, onExpire])

  const justify =
    alert.position === 'top' ? 'flex-start'
    : alert.position === 'bottom' ? 'flex-end'
    : 'center'

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: justify,
        justifyContent: 'center',
        padding: '6vh 6vw',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: 'rgba(10,10,15,0.9)',
          border: '1px solid rgba(201,168,76,0.45)',
          borderRadius: 10,
          padding: '2.2vh 3.5vw',
          maxWidth: '80%',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.7)',
          animation: 'conduit-alert-in 0.35s ease-out',
        }}
      >
        <p
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(18px, 4.2vh, 64px)',
            fontWeight: 400,
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.3,
            margin: 0,
            textShadow: '0 2px 16px rgba(0,0,0,0.9)',
          }}
        >
          {alert.text}
        </p>
      </div>
    </div>
  )
}
