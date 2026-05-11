import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLastFmNowPlaying } from '@/hooks/useLastFmNowPlaying';
import { getBestLastFmImage } from '@/lib/lastfm-client';

interface LastFMNowPlayingProps {
  apiKey: string;
  username: string;
}

export default function LastFMWidget({ apiKey, username }: LastFMNowPlayingProps) {
  const { nowPlaying, isLoading, error, isChanging, userAvatar, avatarError, setAvatarError } =
    useLastFmNowPlaying({ apiKey, username });

  const handleListen = () => {
    if (nowPlaying?.url) {
      window.open(nowPlaying.url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border border-border/50 py-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-primary text-base">now playing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 bg-muted-foreground/20 rounded animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="h-4 bg-muted-foreground/20 rounded animate-pulse mb-2" />
              <div className="h-3 bg-muted-foreground/10 rounded animate-pulse w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border border-border/50 py-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-primary text-base">now playing</CardTitle>
        </CardHeader>
        <CardContent>
          <div data-testid="lastfm-error" className="text-sm text-muted-foreground">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!nowPlaying) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border border-border/50 py-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-primary text-base">now playing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-sm text-muted-foreground">nothing is playing right now</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`bg-card/50 backdrop-blur-sm border border-border/50 transition-all duration-300 py-6 ${
        isChanging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
      }`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-primary text-base flex items-center space-x-2">
          <span>now playing</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="relative">
              {userAvatar && !avatarError ? (
                <img
                  src={userAvatar}
                  alt={`${username} avatar`}
                  className={`w-12 h-12 rounded-full object-cover flex-shrink-0 transition-transform duration-300 ${
                    isChanging ? 'scale-90' : 'scale-100'
                  }`}
                  onError={(e) => {
                    setAvatarError(true);
                    e.currentTarget.src = '/placeholder.jpg';
                  }}
                />
              ) : (
                <div className="relative">
                  <img
                    src={getBestLastFmImage(nowPlaying) || '/placeholder.jpg'}
                    alt={nowPlaying.album['#text']}
                    className={`w-12 h-12 rounded-lg object-cover flex-shrink-0 transition-transform duration-300 ${
                      isChanging ? 'scale-90' : 'scale-100'
                    }`}
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.jpg';
                    }}
                  />
                  {!avatarError && userAvatar === null && (
                    <div className="absolute inset-0 bg-muted/50 rounded-lg flex items-center justify-center">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
              )}
              {isChanging && (
                <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate mb-1">
                {nowPlaying.name}
              </div>
              <div className="text-xs text-muted-foreground truncate mb-1">
                {nowPlaying.artist['#text']}
              </div>
              <div className="text-xs text-muted-foreground/70 truncate">
                {nowPlaying.album['#text']}
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
            Listen on Last.fm
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
