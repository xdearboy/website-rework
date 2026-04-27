import type { DegenMessage } from '@/types/degens'
import { decodeMojibake } from './decodeMojibake'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildAliasMap(messages: DegenMessage[]): Map<string, string> {
  const aliasMap = new Map<string, string>()

  for (const message of messages) {
    for (const name of [message.fromName, message.forwardedFrom]) {
      if (!name || aliasMap.has(name)) {
        continue
      }

      aliasMap.set(name, `User ${aliasMap.size + 1}`)
    }
  }

  return aliasMap
}

function replaceNames(text: string | undefined, aliasMap: Map<string, string>): string | undefined {
  if (!text) {
    return text
  }

  return [...aliasMap.entries()]
    .sort((left, right) => right[0].length - left[0].length)
    .reduce(
      (result, [name, alias]) => result.replace(new RegExp(escapeRegExp(name), 'g'), alias),
      text
    )
}

export function anonymizeMessages(messages: DegenMessage[]): DegenMessage[] {
  const aliasMap = buildAliasMap(messages)

  return messages.map((message) => ({
    ...message,
    fromName: message.fromName ? aliasMap.get(message.fromName) ?? message.fromName : undefined,
    forwardedFrom: message.forwardedFrom
      ? aliasMap.get(message.forwardedFrom) ?? message.forwardedFrom
      : undefined,
    text: decodeMojibake(replaceNames(message.text, aliasMap)),
  }))
}
