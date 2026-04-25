import { Fragment, createElement, type ReactNode } from 'react'
import { sanitizeMessageHtml } from './sanitizeMessageHtml'

function propsForElement(element: HTMLElement): Record<string, string> {
  const props: Record<string, string> = {}

  if (element.tagName.toLowerCase() === 'a') {
    const href = element.getAttribute('href')
    if (href) {
      props.href = href
      props.target = '_blank'
      props.rel = 'noreferrer noopener'
    }
  }

  return props
}

function renderNode(node: Node, key: string): ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null
  }

  const element = node as HTMLElement
  const tagName = element.tagName.toLowerCase()
  const children = Array.from(element.childNodes).map((child, index) =>
    renderNode(child, `${key}-${index}`)
  )

  return createElement(tagName, { key, ...propsForElement(element) }, ...children)
}

export function renderMessageHtml(html: string): ReactNode {
  const safeHtml = sanitizeMessageHtml(html)
  if (!safeHtml) {
    return null
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(safeHtml, 'text/html')
  const children = Array.from(doc.body.childNodes).map((node, index) =>
    renderNode(node, `message-node-${index}`)
  )

  return createElement(Fragment, null, ...children)
}
