export interface LastFMTrack {
  name: string;
  artist: { '#text': string; mbid?: string };
  album: { '#text': string; mbid?: string };
  image: Array<{ '#text': string; size: string }>;
  url?: string;
  '@attr'?: { nowplaying: string };
}

interface LastFMRecentTracksResponse {
  recenttracks: {
    track: LastFMTrack[];
  };
}

interface LastFMUserInfoResponse {
  user?: {
    image?: Array<{ '#text': string; size: string }>;
  };
}

interface LastFMRequestOptions {
  apiKey: string;
  username: string;
  signal?: AbortSignal;
}

const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/';

function buildLastFmUrl(
  method: string,
  apiKey: string,
  username: string,
  extraParams: Record<string, string> = {}
): string {
  const params = new URLSearchParams({
    method,
    user: username,
    api_key: apiKey,
    format: 'json',
    ...extraParams,
  });

  return `${LASTFM_API_URL}?${params.toString()}`;
}

async function fetchLastFmJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`Last.fm request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchLastFmAvatar({
  apiKey,
  username,
  signal,
}: LastFMRequestOptions): Promise<string | null> {
  const url = buildLastFmUrl('user.getInfo', apiKey, username);
  const data = await fetchLastFmJson<LastFMUserInfoResponse>(url, signal);
  const images = data.user?.image ?? [];

  return (
    images[3]?.['#text'] ||
    images[2]?.['#text'] ||
    images[1]?.['#text'] ||
    images[0]?.['#text'] ||
    null
  );
}

export async function fetchLastFmRecentTrack({
  apiKey,
  username,
  signal,
}: LastFMRequestOptions): Promise<LastFMTrack | null> {
  const url = buildLastFmUrl('user.getrecenttracks', apiKey, username, { limit: '1' });
  const data = await fetchLastFmJson<LastFMRecentTracksResponse>(url, signal);
  const currentTrack = data.recenttracks.track[0];

  if (!currentTrack || currentTrack['@attr']?.nowplaying !== 'true') {
    return null;
  }

  return currentTrack;
}

export function getTrackKey(track: LastFMTrack | null): string {
  if (!track) {
    return '';
  }

  return `${track.artist['#text']}::${track.name}`;
}

export function getBestLastFmImage(track: LastFMTrack | null, size = 'medium'): string | null {
  if (!track?.image) {
    return null;
  }

  const image = track.image.find((img) => img.size === size)?.['#text'];
  if (image) {
    return image;
  }

  const fallback = track.image.find((img) => img['#text'])?.['#text'];
  return fallback || null;
}
