import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface AudioPlayerProps {
  src: string
  duration: string
  messageId: string
  isActive: boolean
  onPlay: (id: string) => void
  transcript?: string
}

function parseDuration(duration: string): number {
  const parts = duration.split(':')
  if (parts.length !== 2) {
    return 0
  }

  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function DegenAudioPlayer({
  src,
  duration,
  messageId,
  isActive,
  onPlay,
  transcript,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [error, setError] = useState(false)
  const totalSeconds = parseDuration(duration)

  useEffect(() => {
    if (!isActive && playing) {
      audioRef.current?.pause()
      setPlaying(false)
    }
  }, [isActive, playing])

  function togglePlayback() {
    if (error) {
      return
    }

    if (playing) {
      audioRef.current?.pause()
      setPlaying(false)
      return
    }

    onPlay(messageId)
    audioRef.current?.play().catch(() => setError(true))
    setPlaying(true)
  }

  function seek(value: number) {
    if (!audioRef.current) {
      return
    }

    audioRef.current.currentTime = value
    setCurrentTime(value)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/65 px-3 py-2.5 shadow-sm">
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
          onEnded={() => {
            setPlaying(false)
            setCurrentTime(0)
          }}
          onError={() => {
            setError(true)
            setPlaying(false)
          }}
        />

        <button
          type="button"
          disabled={error}
          onClick={togglePlayback}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80 text-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-40"
          aria-label={playing ? 'Пауза' : 'Играть'}
        >
          {playing ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
        </button>

        {error ? (
          <span className="flex-1 text-sm text-muted-foreground">Аудио недоступно</span>
        ) : (
          <>
            <input
              type="range"
              min={0}
              max={totalSeconds || 1}
              step={0.1}
              value={currentTime}
              onChange={(event) => seek(Number(event.target.value))}
              className="h-1.5 flex-1 cursor-pointer accent-primary"
              aria-label="Перемотка"
            />
            <span className="w-10 shrink-0 text-right text-[11px] tabular-nums tracking-[0.04em] text-muted-foreground">
              {playing || currentTime > 0 ? formatTime(currentTime) : duration}
            </span>
          </>
        )}
      </div>

      {transcript && (
        <div className="rounded-lg border border-border/50 bg-background/45 px-3 py-2 text-xs italic leading-relaxed text-muted-foreground/85">
          "{transcript}"
        </div>
      )}
    </div>
  )
}
