import {
  fetchLastFmAvatar,
  fetchLastFmRecentTrack,
  getTrackKey,
  type LastFMTrack,
} from '@/lib/lastfm-client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const AVATAR_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const POLL_INTERVAL_VISIBLE_MS = 1000 * 30;
const POLL_INTERVAL_HIDDEN_MS = 1000 * 60 * 2;

interface UseLastFmNowPlayingProps {
  apiKey: string;
  username: string;
}

interface CachedAvatar {
  value: string;
  savedAt: number;
}

function getAvatarStorageKey(username: string): string {
  return `lastfm:avatar:${username}`;
}

function readCachedAvatar(username: string): string | null {
  const storageKey = getAvatarStorageKey(username);
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as CachedAvatar;
    if (!parsed.value || Date.now() - parsed.savedAt > AVATAR_CACHE_TTL_MS) {
      localStorage.removeItem(storageKey);
      return null;
    }
    return parsed.value;
  } catch {
    localStorage.removeItem(storageKey);
    return null;
  }
}

function writeCachedAvatar(username: string, value: string): void {
  const storageKey = getAvatarStorageKey(username);
  const payload: CachedAvatar = { value, savedAt: Date.now() };
  localStorage.setItem(storageKey, JSON.stringify(payload));
}

export function useLastFmNowPlaying({ apiKey, username }: UseLastFmNowPlayingProps) {
  const [nowPlaying, setNowPlaying] = useState<LastFMTrack | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  const nowPlayingRef = useRef<LastFMTrack | null>(null);
  const changeTimeoutRef = useRef<number | null>(null);

  const hasCredentials = useMemo(() => Boolean(apiKey && username), [apiKey, username]);

  const fetchTrack = useCallback(async (signal?: AbortSignal) => {
    if (!hasCredentials) {
      setError('missing Last.fm API key or username');
      setIsLoading(false);
      return;
    }

    try {
      const track = await fetchLastFmRecentTrack({ apiKey, username, signal });
      const prevTrack = nowPlayingRef.current;
      const previousKey = getTrackKey(prevTrack);
      const nextKey = getTrackKey(track);

      if (!track) {
        nowPlayingRef.current = null;
        setNowPlaying(null);
        setError(null);
        return;
      }

      if (previousKey && previousKey !== nextKey) {
        setIsChanging(true);

        if (changeTimeoutRef.current) {
          window.clearTimeout(changeTimeoutRef.current);
        }

        changeTimeoutRef.current = window.setTimeout(() => {
          nowPlayingRef.current = track;
          setNowPlaying(track);
          setIsChanging(false);
          changeTimeoutRef.current = null;
        }, 250);

        return;
      }

      nowPlayingRef.current = track;
      setNowPlaying(track);
      setError(null);
    } catch (fetchError) {
      if (!signal?.aborted) {
        setError('failed to load Last.fm');
        console.error('Last.fm track error:', fetchError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, hasCredentials, username]);

  useEffect(() => {
    if (!hasCredentials) {
      return;
    }

    const controller = new AbortController();
    const cachedAvatar = readCachedAvatar(username);
    if (cachedAvatar) {
      setUserAvatar(cachedAvatar);
      return () => controller.abort();
    }

    fetchLastFmAvatar({ apiKey, username, signal: controller.signal })
      .then((avatar) => {
        if (!avatar) {
          return;
        }
        setUserAvatar(avatar);
        writeCachedAvatar(username, avatar);
      })
      .catch((avatarErrorValue) => {
        if (!controller.signal.aborted) {
          console.error('Last.fm avatar error:', avatarErrorValue);
        }
      });

    return () => controller.abort();
  }, [apiKey, hasCredentials, username]);

  useEffect(() => {
    const controller = new AbortController();
    let timeoutId: number | null = null;
    let isMounted = true;

    const scheduleNext = () => {
      if (!isMounted) {
        return;
      }

      const delay = document.hidden ? POLL_INTERVAL_HIDDEN_MS : POLL_INTERVAL_VISIBLE_MS;
      timeoutId = window.setTimeout(runCycle, delay);
    };

    const runCycle = async () => {
      await fetchTrack(controller.signal);
      scheduleNext();
    };

    void runCycle();

    const handleVisibilityChange = () => {
      if (!isMounted) {
        return;
      }

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      void runCycle();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      controller.abort();
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      if (changeTimeoutRef.current) {
        window.clearTimeout(changeTimeoutRef.current);
        changeTimeoutRef.current = null;
      }
    };
  }, [fetchTrack]);

  return {
    nowPlaying,
    isLoading,
    error,
    isChanging,
    userAvatar,
    avatarError,
    setAvatarError,
  };
}
