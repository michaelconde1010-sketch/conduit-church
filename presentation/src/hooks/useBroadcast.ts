import { useEffect, useCallback } from 'react'
import type { BroadcastPayload } from '../types/broadcast'

// Singleton channel per window — created once on first use
let _channel: BroadcastChannel | null = null

function getChannel(): BroadcastChannel {
  if (!_channel) _channel = new BroadcastChannel('conduit-output')
  return _channel
}

export function useBroadcastSend() {
  return useCallback((payload: BroadcastPayload) => {
    getChannel().postMessage(payload)
  }, [])
}

export function useBroadcastReceive(handler: (payload: BroadcastPayload) => void) {
  useEffect(() => {
    const channel = getChannel()
    const listener = (e: MessageEvent<BroadcastPayload>) => handler(e.data)
    channel.addEventListener('message', listener)
    return () => channel.removeEventListener('message', listener)
  }, [handler])
}
