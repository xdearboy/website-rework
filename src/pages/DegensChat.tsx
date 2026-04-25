import { DegenAudioPlayer } from '@/components/degens/AudioPlayer'
import { DegenContextPanel } from '@/components/degens/ContextPanel'
import { DegenMessageBubble } from '@/components/degens/MessageBubble'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { degens } from '@/data/degens'
import { usePageTransition } from '@/hooks/usePageTransition'
import type { DegenMessage } from '@/types/degens'
import { fetchTranscripts } from '@/utils/fetchTranscripts'
import { parseChat } from '@/utils/parseChat'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

export default function DegensChat() {
  const { id } = useParams<{ id: string }>()
  const degen = degens.find((entry) => entry.id === id)
  const transition = usePageTransition()

  const [messages, setMessages] = useState<DegenMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ownerName, setOwnerName] = useState<string | null>(null)
  const [activePlayerId, setActivePlayerId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [transcripts, setTranscripts] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!degen) {
      return
    }

    Promise.all([
      fetch(`/chats/${degen.id}/notes.json`)
        .then((response) => (response.ok ? response.json() : {}))
        .catch(() => ({})),
      fetchTranscripts(degen.id),
    ]).then(([loadedNotes, loadedTranscripts]) => {
      setNotes(loadedNotes as Record<string, string>)
      setTranscripts(loadedTranscripts)
    })
  }, [degen])

  useEffect(() => {
    if (!degen) {
      return
    }

    setLoading(true)
    setError(null)

    fetch(degen.exportPath)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        return response.text()
      })
      .then((html) => {
        const sortedMessages = [...parseChat(html)].sort((a, b) => {
          if (!a.timestamp && !b.timestamp) {
            return 0
          }
          if (!a.timestamp) {
            return 1
          }
          if (!b.timestamp) {
            return -1
          }
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        })

        setMessages(sortedMessages)
        setOwnerName(sortedMessages.find((message) => message.fromName && !message.isForwarded)?.fromName ?? null)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить переписку')
      })
      .finally(() => setLoading(false))
  }, [degen])

  useEffect(() => {
    if (messages.length === 0) {
      return
    }

    const match = window.location.hash.match(/^#message(.+)$/)
    if (match) {
      document.getElementById(`message${match[1]}`)?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  if (!degen) {
    return (
      <div
        className={`flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4 font-mono text-foreground transition-all duration-300 dark ${transition}`}
      >
        <h1 className="text-2xl font-bold">404</h1>
        <Link to="/degens" className="text-primary underline underline-offset-4">
          ← degens
        </Link>
      </div>
    )
  }

  return (
    <div
      className={`relative min-h-screen overflow-hidden bg-background px-3 py-4 font-mono text-foreground transition-all duration-300 dark sm:p-4 ${transition}`}
    >
      <div className="relative z-10 mx-auto max-w-5xl">
        <nav className="mb-6 flex min-w-0 items-center text-xs sm:mb-8 sm:text-sm">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-6">
            <Link to="/" className="text-muted-foreground transition-colors hover:text-[#9BA3D6]">
              main
            </Link>
            <span>/</span>
            <Link
              to="/degens"
              className="text-muted-foreground transition-colors hover:text-[#9BA3D6]"
            >
              degens
            </Link>
            <span>/</span>
            <span className="min-w-0 break-all text-accent sm:break-normal">{degen.name}</span>
          </div>
        </nav>

        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0 space-y-2">
            <h1 className="break-all text-xl sm:break-normal sm:text-2xl">{degen.name}</h1>
            <p className="text-sm text-muted-foreground">
              parsed telegram thread with voice playback, replies and archived notes.
            </p>
          </div>
          <Link
            to="/degens"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← back to index
          </Link>
        </div>

        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,2fr)_320px]">
          <Card className="min-w-0 border border-border/50 bg-card/50 py-4 backdrop-blur-sm sm:py-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-primary">thread</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              {loading && <p className="text-sm text-muted-foreground">loading thread...</p>}

              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {!loading && !error && (
                <div className="flex min-w-0 flex-col gap-1">
                  {messages.map((message, index) => {
                    let isOwner = message.fromName === ownerName

                    if (message.isJoined && !message.fromName) {
                      for (let i = index - 1; i >= 0; i -= 1) {
                        if (messages[i].fromName) {
                          isOwner = messages[i].fromName === ownerName
                          break
                        }
                      }
                    }

                    return (
                      <DegenMessageBubble
                        key={message.id}
                        message={message}
                        isOwner={isOwner}
                        replyTo={messages.find((entry) => entry.id === message.replyToId)}
                        note={notes[message.id]}
                        audioPlayer={
                          message.voiceMessageHref ? (
                            <DegenAudioPlayer
                              src={`/chats/${id}/${message.voiceMessageHref}`}
                              duration={message.voiceDuration ?? '00:00'}
                              messageId={message.id}
                              isActive={activePlayerId === message.id}
                              onPlay={setActivePlayerId}
                              transcript={transcripts[message.id]}
                            />
                          ) : undefined
                        }
                      />
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="min-w-0 space-y-6">
            <DegenContextPanel contextPath={degen.contextPath} />

            <Card className="border border-border/50 bg-card/50 py-4 backdrop-blur-sm sm:py-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-primary">stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between gap-4">
                  <span className="text-foreground">messages</span>
                  <span className="text-muted-foreground">{messages.length}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-foreground">voice notes</span>
                  <span className="text-muted-foreground">
                    {messages.filter((message) => message.voiceMessageHref).length}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-foreground">notes</span>
                  <span className="text-muted-foreground">{Object.keys(notes).length}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-foreground">transcripts</span>
                  <span className="text-muted-foreground">
                    {Object.keys(transcripts).length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
