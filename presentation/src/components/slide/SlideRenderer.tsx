import type { CSSProperties } from 'react'
import type { Theme } from '../../types/theme'
import type { DetectedVerse, VerseOverride } from '../../types/verse'

// containerType is valid CSS but some @types/react versions don't include it
type ExtendedCSS = CSSProperties & { containerType?: string }

interface Props {
  verse: DetectedVerse | null
  theme: Theme
  overrides?: VerseOverride
  /** Fill 100% height instead of maintaining 16:9 aspect ratio — use in OutputWindow */
  fillScreen?: boolean
  /** Resolved data URI for an image background. Callers look this up in mediaStore. */
  bgImageSrc?: string | null
}

export function SlideRenderer({
  verse, theme, overrides, fillScreen = false, bgImageSrc = null,
}: Props) {
  const bodyFont = {
    ...theme.bodyFont,
    ...(overrides?.bodyFontSize != null ? { size: overrides.bodyFontSize } : {}),
  }
  const bg = overrides?.background ?? theme.background
  const displayText = (overrides?.editedText ?? verse?.text ?? '').trim()
  const displayRef = verse?.ref ?? ''
  const displayTranslation = overrides?.translation ?? theme.translation

  let backgroundStyle: CSSProperties
  if (bg.type === 'image' && bgImageSrc) {
    backgroundStyle = {
      backgroundImage: `url(${bgImageSrc})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundColor: bg.color,
    }
  } else if (bg.type === 'gradient') {
    backgroundStyle = {
      background: `linear-gradient(${bg.gradient.direction}, ${bg.gradient.from}, ${bg.gradient.to})`,
    }
  } else {
    backgroundStyle = { backgroundColor: bg.color }
  }

  const shadow = theme.textShadow
    ? '0 2px 28px rgba(0,0,0,0.95), 0 1px 6px rgba(0,0,0,0.9)'
    : 'none'

  const slideStyle: ExtendedCSS = {
    ...backgroundStyle,
    width: '100%',
    ...(fillScreen ? { height: '100%' } : { aspectRatio: '16 / 9' }),
    position: 'relative',
    overflow: 'hidden',
    containerType: 'size',
  }

  if (!verse) {
    return (
      <div style={slideStyle}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              color: 'rgba(255,255,255,0.11)',
              fontFamily: "'Cinzel', serif",
              fontSize: '2.4cqw',
              letterSpacing: '6px',
              textTransform: 'uppercase',
            }}
          >
            No verse staged
          </span>
        </div>
      </div>
    )
  }

  return (
    <div style={slideStyle}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: `${theme.padding.y}cqh ${theme.padding.x}cqw`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          textAlign: theme.textAlign,
        }}
      >
        <p
          style={{
            fontFamily: `'${bodyFont.family}', serif`,
            fontSize: `${bodyFont.size}cqw`,
            fontWeight: bodyFont.weight,
            color: bodyFont.color,
            textShadow: shadow,
            lineHeight: 1.38,
            margin: 0,
            marginBottom: '2.8cqh',
          }}
        >
          {displayText}
        </p>

        <p
          style={{
            fontFamily: `'${theme.refFont.family}', serif`,
            fontSize: `${theme.refFont.size}cqw`,
            fontWeight: theme.refFont.weight,
            color: theme.refFont.color,
            textShadow: shadow,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          {displayRef}&ensp;·&ensp;{displayTranslation}
        </p>
      </div>
    </div>
  )
}
