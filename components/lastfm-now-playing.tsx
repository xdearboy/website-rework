"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface LastFMTrack {
  name: string
  artist: { "#text": string; mbid?: string }
  album: { "#text": string; mbid?: string }
  image: Array<{ "#text": string; size: string }>
  url?: string
  "@attr"?: { nowplaying: string }
}

interface LastFMResponse {
  recenttracks: {
    track: LastFMTrack[]
  }
}

interface LastFMNowPlayingProps {
  apiKey: string
  username: string
}

export default function LastFMNowPlaying({ apiKey, username }: LastFMNowPlayingProps) {
  const [nowPlaying, setNowPlaying] = useState<LastFMTrack | null>(null)
  const [prevTrack, setPrevTrack] = useState<LastFMTrack | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isChanging, setIsChanging] = useState(false)

  const fetchNowPlaying = useCallback(async () => {
    try {
      if (!apiKey || !username) {
        setError("Укажите API ключ и имя пользователя")
        setIsLoading(false)
        return
      }

      const response = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${apiKey}&format=json&limit=1`
      )

      if (!response.ok) {
        throw new Error("Failed to fetch Last.fm data")
      }

      const data: LastFMResponse = await response.json()

      const tracks = data.recenttracks.track
      if (tracks && tracks.length > 0) {
        const currentTrack = tracks[0]
        
        // Проверяем, играет ли сейчас трек (атрибут nowplaying)
        if (currentTrack["@attr"]?.nowplaying === "true") {
          // Проверяем сменился ли трек
          if (!prevTrack || currentTrack.name !== prevTrack.name || currentTrack.artist["#text"] !== prevTrack.artist["#text"]) {
            setIsChanging(true)
            setPrevTrack(nowPlaying)
            setTimeout(() => {
              setNowPlaying(currentTrack)
              setIsChanging(false)
            }, 300)
          } else {
            setNowPlaying(currentTrack)
          }
        } else {
          setNowPlaying(null)
        }
      }
    } catch (err) {
      setError("Ошибка загрузки данных с Last.fm")
      console.error("Last.fm error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [apiKey, username, prevTrack, nowPlaying])

  useEffect(() => {
    fetchNowPlaying()
    const interval = setInterval(fetchNowPlaying, 15000)
    return () => clearInterval(interval)
  }, [fetchNowPlaying])

  const getAlbumImage = (size: string = "medium") => {
    if (!nowPlaying?.image) return null
    const image = nowPlaying.image.find(img => img.size === size)
    return image?.["#text"] || nowPlaying.image[2]?.["#text"] || "/placeholder.jpg"
  }

  const handleListen = () => {
    if (nowPlaying?.url) {
      window.open(nowPlaying.url, '_blank')
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-primary text-base">now playing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-muted-foreground/20 rounded animate-pulse"></div>
            </div>
            <div className="flex-1">
              <div className="h-4 bg-muted-foreground/20 rounded animate-pulse mb-2"></div>
              <div className="h-3 bg-muted-foreground/10 rounded animate-pulse w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-primary text-base">now playing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (!nowPlaying) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-primary text-base">now playing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-sm text-muted-foreground">Сейчас ничего не играет</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-card/50 backdrop-blur-sm border border-border/50 transition-all duration-300 ${isChanging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-primary text-base flex items-center space-x-2">
          <span>now playing</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="relative">
              <img 
                src={getAlbumImage() || "/placeholder.jpg"} 
                alt={nowPlaying.album["#text"]} 
                className={`w-12 h-12 rounded-lg object-cover flex-shrink-0 transition-transform duration-300 ${isChanging ? 'scale-90' : 'scale-100'}`}
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.jpg"
                }}
              />
              {isChanging && (
                <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate mb-1">
                {nowPlaying.name}
              </div>
              <div className="text-xs text-muted-foreground truncate mb-1">
                {nowPlaying.artist["#text"]}
              </div>
              <div className="text-xs text-muted-foreground/70 truncate">
                {nowPlaying.album["#text"]}
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleListen}
            size="sm" 
            variant="outline"
            className="w-full text-xs h-8"
            disabled={!nowPlaying.url}
          >
            🎵 Listen on Last.fm
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}