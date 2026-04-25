export type DegenMessage = {
  id: string
  type: 'message' | 'service'
  fromName?: string
  text?: string
  timestamp?: string
  isJoined?: boolean
  replyToId?: string
  isForwarded?: boolean
  forwardedFrom?: string
  voiceMessageHref?: string
  voiceDuration?: string
}

export type Degen = {
  id: string
  name: string
  exportPath: string
  contextPath?: string
}
