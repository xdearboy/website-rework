import { degens } from '@/data/degens'
import { usePageTransition } from '@/hooks/usePageTransition'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DegensList() {
  const transition = usePageTransition()

  return (
    <div
      className={`relative min-h-screen overflow-hidden bg-background p-4 font-mono text-foreground transition-all duration-300 dark ${transition}`}
    >
      <div className="relative z-10 mx-auto max-w-4xl">
        <nav className="mb-8 flex items-center text-sm">
          <div className="flex space-x-6">
            <Link to="/" className="text-muted-foreground transition-colors hover:text-[#9BA3D6]">
              main
            </Link>
            <span>/</span>
            <Link
              to="/blog"
              className="text-muted-foreground transition-colors hover:text-[#9BA3D6]"
            >
              blog
            </Link>
            <span>/</span>
            <span className="text-accent">degens</span>
          </div>
        </nav>

        <div className="mb-6 space-y-2">
          <h1 className="text-2xl">degens_archive</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            telegram exports, voice notes, context fragments and direct jumps into the archive.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Card className="border border-border/50 bg-card/50 py-6 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-primary">available threads</CardTitle>
            </CardHeader>
            <CardContent>
              {degens.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">
                  no chats available yet
                </p>
              ) : (
                <div className="space-y-3">
                  {degens.map((degen) => (
                    <Link key={degen.id} to={`/degens/${degen.id}`}>
                      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/30 px-4 py-3 transition-colors hover:bg-accent/40">
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{degen.name}</p>
                          <p className="text-xs text-muted-foreground">
                            /chats/{degen.id}/messages.html
                          </p>
                        </div>
                        <ChevronRight className="text-muted-foreground" size={16} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-border/50 bg-card/50 py-6 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-primary">notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-muted-foreground">
              <p>messages preserve reply chains and voice message timing.</p>
              <p>context blocks stay attached to each thread instead of living in a separate app.</p>
              <p>links from the main page now lead here directly, so the archive feels native.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
