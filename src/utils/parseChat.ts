import type { DegenMessage } from '@/types/degens'

export function parseChat(html: string): DegenMessage[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const elements = doc.querySelectorAll('.history .message')
  const messages: DegenMessage[] = []

  for (const el of elements) {
    try {
      const element = el as HTMLElement
      const rawId = element.id
      if (!rawId) throw new Error('No id')
      const id = rawId.replace(/^message-?/, '')

      if (element.classList.contains('service')) {
        const details = element.querySelector('.body.details')
        messages.push({ id, type: 'service', text: details?.textContent?.trim() })
        continue
      }

      let fromName: string | undefined
      const body = element.querySelector(':scope > .body')
      if (body) {
        const directFromName = body.querySelector(':scope > .from_name')
        if (directFromName) fromName = directFromName.textContent?.trim()
      }

      let text: string | undefined
      if (body) {
        const directText = body.querySelector(':scope > .text')
        if (directText) text = directText.innerHTML.trim()
      }

      const dateEl = element.querySelector('.pull_right.date.details')
      const timestampTitle = dateEl?.getAttribute('title')
      const timestamp = timestampTitle ? parseTimestamp(timestampTitle) : undefined
      const isJoined = element.classList.contains('joined')

      let replyToId: string | undefined
      const replyLink = element.querySelector('.reply_to a[href]')
      if (replyLink) {
        const href = replyLink.getAttribute('href') ?? ''
        const match = href.match(/#go_to_message(\d+)/)
        if (match) replyToId = match[1]
      }

      const isForwarded = element.querySelector('.forwarded') !== null
      let forwardedFrom: string | undefined
      if (isForwarded) {
        const fwdFromName = element.querySelector('.forwarded .from_name')
        if (fwdFromName) {
          const clone = fwdFromName.cloneNode(true) as HTMLElement
          clone.querySelector('span')?.remove()
          forwardedFrom = clone.textContent?.trim()
        }
      }

      const voiceEl = element.querySelector('.media_voice_message')
      const voiceMessageHref = voiceEl?.getAttribute('href') ?? undefined
      const voiceDuration = voiceEl?.querySelector('.status.details')?.textContent?.trim() ?? undefined

      messages.push({ id, type: 'message', fromName, text, timestamp, isJoined, replyToId, isForwarded, forwardedFrom, voiceMessageHref, voiceDuration })
    } catch { continue }
  }

  return messages
}

function parseTimestamp(title: string): string | undefined {
  const match = title.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2}):(\d{2})\s+UTC([+-])(\d{2}):(\d{2})$/)
  if (!match) return undefined
  const [, day, month, year, hours, minutes, seconds, sign, offsetH, offsetM] = match
  const offsetMinutes = (parseInt(offsetH) * 60 + parseInt(offsetM)) * (sign === '+' ? 1 : -1)
  const localMs = Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds))
  return new Date(localMs - offsetMinutes * 60 * 1000).toISOString()
}
