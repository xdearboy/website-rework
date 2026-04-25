const ALLOWED_TAGS = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'code',
  'em',
  'i',
  'pre',
  's',
  'span',
  'strong',
  'u',
])

const DROP_WITH_CONTENT = new Set(['script', 'style', 'iframe', 'object', 'embed'])

function isSafeHref(href: string): boolean {
  return /^(https?:|mailto:|tg:|#|\/)/i.test(href)
}

function sanitizeNode(node: Node, document: Document): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(node.textContent ?? '')
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null
  }

  const element = node as HTMLElement
  const tagName = element.tagName.toLowerCase()

  if (DROP_WITH_CONTENT.has(tagName)) {
    return null
  }

  if (!ALLOWED_TAGS.has(tagName)) {
    const fragment = document.createDocumentFragment()
    for (const child of Array.from(element.childNodes)) {
      const sanitizedChild = sanitizeNode(child, document)
      if (sanitizedChild) {
        fragment.appendChild(sanitizedChild)
      }
    }
    return fragment
  }

  const cleanElement = document.createElement(tagName)

  if (tagName === 'a') {
    const href = element.getAttribute('href')?.trim()
    if (href && isSafeHref(href)) {
      cleanElement.setAttribute('href', href)
      cleanElement.setAttribute('target', '_blank')
      cleanElement.setAttribute('rel', 'noreferrer noopener')
    }
  }

  for (const child of Array.from(element.childNodes)) {
    const sanitizedChild = sanitizeNode(child, document)
    if (sanitizedChild) {
      cleanElement.appendChild(sanitizedChild)
    }
  }

  return cleanElement
}

export function sanitizeMessageHtml(html: string): string {
  const parser = new DOMParser()
  const source = parser.parseFromString(html, 'text/html')
  const clean = document.implementation.createHTMLDocument('')
  const fragment = clean.createDocumentFragment()

  for (const child of Array.from(source.body.childNodes)) {
    const sanitizedChild = sanitizeNode(child, clean)
    if (sanitizedChild) {
      fragment.appendChild(sanitizedChild)
    }
  }

  const container = clean.createElement('div')
  container.appendChild(fragment)
  return container.innerHTML
}
