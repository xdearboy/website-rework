import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderMessageHtml } from './renderMessageHtml'

describe('renderMessageHtml', () => {
  it('renders formatted telegram html without raw injection', () => {
    const { container } = render(
      <div>{renderMessageHtml('hello <strong>world</strong><br><blockquote>quoted</blockquote>')}</div>
    )

    expect(container.querySelector('strong')?.textContent).toBe('world')
    expect(container.querySelector('blockquote')?.textContent).toBe('quoted')
    expect(container.querySelector('script')).toBeNull()
  })

  it('keeps safe links and drops dangerous href values', () => {
    const { container } = render(
      <div>
        {renderMessageHtml(
          '<a href="javascript:alert(1)">bad</a><a href="https://example.com">good</a>'
        )}
      </div>
    )

    const links = container.querySelectorAll('a')
    expect(links).toHaveLength(2)
    expect(links[0].getAttribute('href')).toBeNull()
    expect(links[1].getAttribute('href')).toBe('https://example.com')
  })
})
