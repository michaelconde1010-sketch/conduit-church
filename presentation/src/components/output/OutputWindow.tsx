import { useState, useCallback, useEffect } from 'react'
import { useBroadcastReceive } from '../../hooks/useBroadcast'
import { useMediaStore } from '../../stores/mediaStore'
import { SlideRenderer } from '../slide/SlideRenderer'
import { CountdownOverlay } from './CountdownOverlay'
import { AlertOverlay } from './AlertOverlay'
import type { StagedVerse } from '../../types/verse'
import type { Theme } from '../../types/theme'
import type { BroadcastPayload } from '../../types/broadcast'
import type { Alert } from '../../stores/alertStore'

// Used until the operator's first VERSE_LIVE or THEME_UPDATE arrives
const INITIAL_THEME: Theme = {
  id: 'dark-minimal',
  name: 'Dark Minimal',
  bodyFont: { family: 'Cormorant Garamond', size: 5.5, color: '#ffffff', weight: 300 },
  refFont: { family: 'Cinzel', size: 2, color: '#c9a84c', weight: 400 },
  textAlign: 'center',
  textShadow: true,
  padding: { x: 8, y: 6 },
  background: {
    type: 'solid',
    color: '#0a0a0f',
    gradient: { from: '#0a0a0f', to: '#1a1a2e', direction: '135deg' },
    imageId: null,
  },
  translation: 'KJV',
  lowerThird: { enabled: false, barOpacity: 0.85 },
  transition: 'fade',
}

export function OutputWindow() {
  const [staged, setStaged] = useState<StagedVerse | null>(null)
  const [theme, setTheme] = useState<Theme>(INITIAL_THEME)
  const [mode, setMode] = useState<'fullscreen' | 'lowerthird'>('fullscreen')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [alert, setAlert] = useState<Alert | null>(null)

  const library = useMediaStore((s) => s.library)

  const handleMessage = useCallback((payload: BroadcastPayload) => {
    switch (payload.type) {
      case 'VERSE_LIVE':
        setStaged(payload.staged)
        setTheme(payload.theme)
        break
      case 'CLEAR_SCREEN':
        setStaged(null)
        break
      case 'THEME_UPDATE':
        setTheme(payload.theme)
        break
      case 'DISPLAY_MODE':
        setMode(payload.mode)
        break
      case 'COUNTDOWN':
        setCountdown(payload.seconds > 0 ? payload.seconds : null)
        break
      case 'ALERT':
        setAlert({ text: payload.text, position: payload.position, duration: payload.duration })
        break
      case 'ALERT_DISMISS':
        setAlert(null)
        break
    }
  }, [])

  useBroadcastReceive(handleMessage)

  // Pick up images uploaded in the operator window (same origin → storage event fires)
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'conduit-media') void useMediaStore.persist.rehydrate()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    document.title = staged ? `${staged.verse.ref} · Conduit` : 'Conduit Output'
  }, [staged])

  const bg = staged?.overrides?.background ?? theme.background
  const bgImageSrc =
    bg.type === 'image' && bg.imageId
      ? library.find((m) => m.id === bg.imageId)?.src ?? null
      : null

  const overlays = (
    <>
      {alert && <AlertOverlay alert={alert} onExpire={() => setAlert(null)} />}
      {countdown != null && (
        <CountdownOverlay initialSeconds={countdown} onDone={() => setCountdown(null)} />
      )}
    </>
  )

  // ── Full-screen slide ──────────────────────────────────────────────────────
  if (mode === 'fullscreen') {
    return (
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
        <SlideRenderer
          verse={staged?.verse ?? null}
          theme={theme}
          overrides={staged?.overrides}
          bgImageSrc={bgImageSrc}
          fillScreen
        />
        {overlays}
      </div>
    )
  }

  // ── Lower third ────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: '#000',
      }}
    >
      {staged && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '32%',
            background: `linear-gradient(to top, rgba(0,0,0,${theme.lowerThird.barOpacity}), transparent)`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '0 5vw 3.5vh',
            textAlign: theme.textAlign,
          }}
        >
          <p
            style={{
              fontFamily: `'${theme.bodyFont.family}', serif`,
              fontSize: 'clamp(18px, 3.2vh, 52px)',
              fontWeight: theme.bodyFont.weight,
              color: theme.bodyFont.color,
              textShadow: theme.textShadow ? '0 2px 12px rgba(0,0,0,0.9)' : 'none',
              lineHeight: 1.35,
              margin: 0,
              marginBottom: '0.9vh',
            }}
          >
            {(staged.overrides?.editedText ?? staged.verse.text).trim()}
          </p>
          <p
            style={{
              fontFamily: `'${theme.refFont.family}', serif`,
              fontSize: 'clamp(11px, 1.6vh, 26px)',
              fontWeight: theme.refFont.weight,
              color: theme.refFont.color,
              textShadow: theme.textShadow ? '0 1px 6px rgba(0,0,0,0.9)' : 'none',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            {staged.verse.ref}
            &ensp;·&ensp;
            {staged.overrides?.translation ?? staged.verse.translation}
          </p>
        </div>
      )}
      {overlays}
    </div>
  )
}
