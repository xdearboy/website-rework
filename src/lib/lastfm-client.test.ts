import { describe, expect, it } from 'vitest';
import { getBestLastFmImage, getTrackKey, type LastFMTrack } from './lastfm-client';

function createTrack(overrides: Partial<LastFMTrack> = {}): LastFMTrack {
  return {
    name: 'Track',
    artist: { '#text': 'Artist' },
    album: { '#text': 'Album' },
    image: [
      { '#text': 'small.jpg', size: 'small' },
      { '#text': 'medium.jpg', size: 'medium' },
      { '#text': 'large.jpg', size: 'large' },
    ],
    ...overrides,
  };
}

describe('lastfm-client helpers', () => {
  it('builds stable track keys', () => {
    expect(getTrackKey(createTrack())).toBe('Artist::Track');
    expect(getTrackKey(null)).toBe('');
  });

  it('returns requested image size and fallback', () => {
    expect(getBestLastFmImage(createTrack(), 'medium')).toBe('medium.jpg');
    expect(
      getBestLastFmImage(
        createTrack({
          image: [{ '#text': 'only-large.jpg', size: 'large' }],
        }),
        'medium'
      )
    ).toBe('only-large.jpg');
  });
});
