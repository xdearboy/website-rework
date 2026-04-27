interface AudioPlayerProps {
  transcript?: string
}

export function DegenAudioPlayer({ transcript }: AudioPlayerProps) {
  if (!transcript) {
    return (
      <div className="rounded-lg border border-dashed border-border/50 bg-background/35 px-3 py-2 text-xs leading-relaxed text-muted-foreground/80">
        transcript unavailable
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border/50 bg-background/45 px-3 py-2 text-xs italic leading-relaxed text-muted-foreground/85">
      "{transcript}"
    </div>
  )
}
