import { describe, expect, it } from 'vitest'
import { sanitizeMessageHtml } from './sanitizeMessageHtml'

describe('sanitizeMessageHtml', () => {
  it('keeps basic formatting used by telegram export', () => {
    const html = 'hello <strong>world</strong><br><blockquote>quoted</blockquote>'
    expect(sanitizeMessageHtml(html)).toBe(
      'hello <strong>world</strong><br><blockquote>quoted</blockquote>'
    )
  })

  it('removes script tags and inline event handlers', () => {
    const html = '<script>alert(1)</script><span onclick="alert(1)">safe</span>'
    expect(sanitizeMessageHtml(html)).toBe('<span>safe</span>')
  })

  it('drops dangerous href values', () => {
    const html = '<a href="javascript:alert(1)">click</a><a href="https://example.com">ok</a>'
    expect(sanitizeMessageHtml(html)).toBe(
      '<a>click</a><a href="https://example.com" target="_blank" rel="noreferrer noopener">ok</a>'
    )
  })

  it('unwraps unsupported tags but keeps text content', () => {
    const html = '<div>text <mark>inside</mark></div>'
    expect(sanitizeMessageHtml(html)).toBe('text inside')
  })
})
