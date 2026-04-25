import { describe, expect, it } from 'vitest'
import { parseChat } from './parseChat'

function wrap(inner: string): string {
  return `<html><body><div class="history">${inner}</div></body></html>`
}

describe('parseChat', () => {
  it('returns an empty array for empty html', () => {
    expect(parseChat('')).toEqual([])
    expect(parseChat('<html><body></body></html>')).toEqual([])
    expect(parseChat(wrap(''))).toEqual([])
  })

  it('parses service messages', () => {
    const html = wrap(`
      <div class="message service" id="message-1">
        <div class="body details">25 April 2026</div>
      </div>
    `)

    const messages = parseChat(html)

    expect(messages).toHaveLength(1)
    expect(messages[0].type).toBe('service')
    expect(messages[0].id).toBe('1')
    expect(messages[0].text).toBe('25 April 2026')
  })

  it('parses forwarded messages', () => {
    const html = wrap(`
      <div class="message default clearfix" id="message745084">
        <div class="body">
          <div class="pull_right date details" title="25.04.2026 19:03:44 UTC+03:00">19:03</div>
          <div class="from_name">kezux</div>
          <div class="forwarded body">
            <div class="from_name">Ander <span class="date details" title="25.04.2026 19:02:26 UTC+03:00">25.04.2026 19:02:26</span></div>
            <div class="media_wrap clearfix">
              <a class="media clearfix pull_left block_link media_voice_message" href="voice_messages/audio_1.ogg">
                <div class="body">
                  <div class="title bold">Voice message</div>
                  <div class="status details">00:38</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    `)

    const messages = parseChat(html)

    expect(messages).toHaveLength(1)
    expect(messages[0].isForwarded).toBe(true)
    expect(messages[0].forwardedFrom).toBe('Ander')
  })

  it('parses voice message metadata', () => {
    const html = wrap(`
      <div class="message default clearfix" id="message745084">
        <div class="body">
          <div class="pull_right date details" title="25.04.2026 19:03:44 UTC+03:00">19:03</div>
          <div class="from_name">kezux</div>
          <div class="forwarded body">
            <div class="from_name">Ander <span>date</span></div>
            <div class="media_wrap clearfix">
              <a class="media clearfix pull_left block_link media_voice_message" href="voice_messages/audio_1.ogg">
                <div class="body">
                  <div class="title bold">Voice message</div>
                  <div class="status details">00:38</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    `)

    const messages = parseChat(html)

    expect(messages).toHaveLength(1)
    expect(messages[0].voiceMessageHref).toBe('voice_messages/audio_1.ogg')
    expect(messages[0].voiceDuration).toBe('00:38')
  })

  it('marks joined messages', () => {
    const html = wrap(`
      <div class="message default clearfix joined" id="message745087">
        <div class="body">
          <div class="pull_right date details" title="25.04.2026 19:05:49 UTC+03:00">19:05</div>
          <div class="text">joined text</div>
        </div>
      </div>
    `)

    const messages = parseChat(html)

    expect(messages).toHaveLength(1)
    expect(messages[0].isJoined).toBe(true)
  })

  it('parses reply ids', () => {
    const html = wrap(`
      <div class="message default clearfix" id="message745086">
        <div class="body">
          <div class="pull_right date details" title="25.04.2026 19:05:18 UTC+03:00">19:05</div>
          <div class="from_name">dd;(dddd</div>
          <div class="reply_to details">
            In reply to <a href="#go_to_message745084" onclick="return GoToMessage(745084)">this message</a>
          </div>
          <div class="text">reply text</div>
        </div>
      </div>
    `)

    const messages = parseChat(html)

    expect(messages).toHaveLength(1)
    expect(messages[0].replyToId).toBe('745084')
  })

  it('skips malformed messages and keeps valid ones', () => {
    const html = wrap(`
      <div class="message default clearfix">
        <div class="body">
          <div class="pull_right date details" title="25.04.2026 19:03:28 UTC+03:00">19:03</div>
          <div class="from_name">someone</div>
          <div class="text">this has no id</div>
        </div>
      </div>
      <div class="message default clearfix" id="message745083">
        <div class="body">
          <div class="pull_right date details" title="25.04.2026 19:03:28 UTC+03:00">19:03</div>
          <div class="from_name">kezux</div>
          <div class="text">valid message</div>
        </div>
      </div>
    `)

    const messages = parseChat(html)

    expect(messages).toHaveLength(1)
    expect(messages[0].id).toBe('745083')
  })

  it('parses timestamps to iso strings', () => {
    const html = wrap(`
      <div class="message default clearfix" id="message745083">
        <div class="body">
          <div class="pull_right date details" title="25.04.2026 19:03:28 UTC+03:00">19:03</div>
          <div class="from_name">kezux</div>
          <div class="text">hello</div>
        </div>
      </div>
    `)

    const messages = parseChat(html)

    expect(messages).toHaveLength(1)
    expect(messages[0].timestamp).toBe('2026-04-25T16:03:28.000Z')
  })

  it('does not read fromName from forwarded blocks', () => {
    const html = wrap(`
      <div class="message default clearfix" id="message745084">
        <div class="body">
          <div class="pull_right date details" title="25.04.2026 19:03:44 UTC+03:00">19:03</div>
          <div class="from_name">kezux</div>
          <div class="forwarded body">
            <div class="from_name">Ander <span>date</span></div>
          </div>
        </div>
      </div>
    `)

    const messages = parseChat(html)

    expect(messages[0].fromName).toBe('kezux')
  })
})
