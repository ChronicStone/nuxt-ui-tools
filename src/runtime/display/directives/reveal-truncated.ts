import type { Directive } from 'vue'

/** Marks a `title` this directive set, so it can be cleared and an authored one is left alone. */
const OWNED = 'data-display-title'

/**
 * Shows the full text of a clipped element on hover and focus. When the element or one of its
 * descendants cuts its text (`truncate`, `line-clamp`, or any `ui` class that clips), the element
 * gets a `title` with the whole text; the title goes away once nothing is cut. An authored `title`
 * is kept.
 */
export const vRevealTruncated: Directive<HTMLElement> = {
  beforeUnmount(element) {
    element.removeEventListener('pointerenter', onReveal)
    element.removeEventListener('focusin', onReveal)
  },
  mounted(element) {
    element.addEventListener('pointerenter', onReveal)
    element.addEventListener('focusin', onReveal)
  },
}

function onReveal(event: Event) {
  if (event.currentTarget instanceof HTMLElement) revealTruncated(event.currentTarget)
}

/** Sets or clears the element's `title` from whether its text is cut right now. */
export function revealTruncated(element: HTMLElement) {
  if (element.hasAttribute('title') && !element.hasAttribute(OWNED)) return
  const text = element.textContent?.replaceAll(/\s+/gu, ' ').trim() ?? ''
  if (text && [element, ...element.querySelectorAll<HTMLElement>('*')].some(isClipped)) {
    element.setAttribute('title', text)
    element.setAttribute(OWNED, '')
    return
  }
  if (!element.hasAttribute(OWNED)) return
  element.removeAttribute('title')
  element.removeAttribute(OWNED)
}

function isClipped(element: HTMLElement) {
  const style = getComputedStyle(element)
  const cuts =
    style.textOverflow === 'ellipsis' ||
    (style.webkitLineClamp !== '' && style.webkitLineClamp !== 'none') ||
    style.overflowX === 'hidden' ||
    style.overflowY === 'hidden'
  return (
    cuts &&
    (element.scrollWidth > element.clientWidth + 1 ||
      element.scrollHeight > element.clientHeight + 1)
  )
}
