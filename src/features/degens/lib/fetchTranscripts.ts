import { decodeMojibake } from './decodeMojibake';

export async function fetchTranscripts(degenId: string): Promise<Record<string, string>> {
  try {
    const res = await fetch(`/transcripts/${degenId}.json`);
    if (!res.ok) return {};
    const data = (await res.json()) as Record<string, string>;
    return Object.fromEntries(
      Object.entries(data).map(([id, transcript]) => [id, decodeMojibake(transcript) ?? transcript])
    );
  } catch {
    return {};
  }
}
