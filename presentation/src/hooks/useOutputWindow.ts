import { useCallback, useRef } from 'react'

export function useOutputWindow() {
  const winRef = useRef<Window | null>(null)

  const open = useCallback(() => {
    const base = window.location.href.split('#')[0]
    const url = `${base}#/output`
    const existing = winRef.current
    if (existing && !existing.closed) {
      existing.focus()
      return
    }
    const w = window.open(
      url,
      'conduit-output',
      'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no'
    )
    if (w) winRef.current = w
  }, [])

  const isOpen = useCallback(() => {
    return !!(winRef.current && !winRef.current.closed)
  }, [])

  return { open, isOpen }
}
