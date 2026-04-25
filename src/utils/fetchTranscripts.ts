export async function fetchTranscripts(degenId: string): Promise<Record<string, string>> {
  try {
    const res = await fetch(`/transcripts/${degenId}.json`)
    if (!res.ok) return {}
    return await res.json() as Record<string, string>
  } catch {
    return {}
  }
}
