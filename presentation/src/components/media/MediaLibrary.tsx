import { useRef, useState } from 'react'
import { useMediaStore, MAX_MEDIA } from '../../stores/mediaStore'
import { useThemeStore } from '../../stores/themeStore'

export function MediaLibrary() {
  const { library, addMedia, removeMedia } = useMediaStore()
  const { theme, setTheme } = useThemeStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const activeId = theme.background.type === 'image' ? theme.background.imageId : null

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    setError(null)
    for (const file of Array.from(files)) {
      const res = await addMedia(file)
      if (!res.ok) { setError(res.error); break }
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  function selectImage(id: string) {
    setTheme({ background: { ...theme.background, type: 'image', imageId: id } })
  }

  function handleRemove(id: string) {
    if (activeId === id) {
      setTheme({ background: { ...theme.background, type: 'solid', imageId: null } })
    }
    removeMedia(id)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/50">Backgrounds</span>
        <span className="text-[10px] text-white/25 tabular-nums">
          {library.length}/{MAX_MEDIA}
        </span>
      </div>

      {/* Upload */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={library.length >= MAX_MEDIA}
        className={`w-full py-6 rounded-lg border border-dashed text-[11px] transition-all ${
          library.length >= MAX_MEDIA
            ? 'border-white/8 text-white/18 cursor-not-allowed'
            : 'border-white/15 text-white/40 hover:border-gold/35 hover:text-gold/80'
        }`}
      >
        {library.length >= MAX_MEDIA
          ? 'Library full — remove one to add more'
          : '＋ Upload image'}
      </button>

      {error && <p className="text-[10px] text-red-400/80 leading-relaxed">{error}</p>}

      {/* Grid */}
      {library.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {library.map((m) => (
            <div
              key={m.id}
              className="relative rounded-lg overflow-hidden border transition-all group"
              style={{
                borderColor: activeId === m.id
                  ? 'rgba(201,168,76,0.6)'
                  : 'rgba(255,255,255,0.08)',
              }}
            >
              <button onClick={() => selectImage(m.id)} className="block w-full">
                <img
                  src={m.src}
                  alt={m.name}
                  className="w-full aspect-video object-cover"
                />
              </button>

              {activeId === m.id && (
                <span className="absolute top-1 left-1 text-[9px] bg-gold text-black font-semibold px-1.5 py-0.5 rounded tracking-wide">
                  IN USE
                </span>
              )}

              <button
                onClick={() => handleRemove(m.id)}
                className="absolute top-1 right-1 w-5 h-5 rounded bg-black/70 text-white/50 hover:text-red-400 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                title="Remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {library.length > 0 && activeId && (
        <button
          onClick={() => setTheme({ background: { ...theme.background, type: 'solid' } })}
          className="w-full py-1.5 rounded text-[11px] border border-white/10 text-white/40 hover:text-white/70 hover:border-white/22 transition-all"
        >
          Use solid colour instead
        </button>
      )}

      <p className="text-[10px] text-white/22 leading-relaxed">
        Images are stored in this browser only, capped at 0.9 MB each.
      </p>
    </div>
  )
}
