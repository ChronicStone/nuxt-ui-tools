import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import type { ComputedRef } from 'vue'

import type { FormPageSectionState } from '../types'

/** Quiet time after the last scroll event before a programmatic scroll counts as finished. */
const SCROLL_SETTLE_MS = 120
/** Pixels a section top may sit below the activation line and still count as reached. */
const ACTIVATION_SLACK = 8

interface ScrollToOptions {
  /** Defaults to `smooth`, or `instant` when the user prefers reduced motion. */
  behavior?: ScrollBehavior
  /** Records the section in the URL hash. Defaults to the page `hash` option. */
  hash?: boolean
  /** Moves focus to the section title, for keyboard and screen reader users. */
  focus?: boolean
}

/**
 * Scroll behavior of a form page: which section is in view (a scrollspy on the nearest scrolling
 * ancestor), scrolling to a section, and the URL hash that records and restores it.
 *
 * A section counts as reached once its top passes the line its `scroll-margin-top` defines, the
 * same offset `scrollIntoView` honors, so the pinned header and the scrollspy agree.
 */
export function useFormPageScroll(params: {
  sections: ComputedRef<readonly FormPageSectionState[]>
  /** Element the scroll container is looked up from: the page itself, or an ancestor. */
  root: () => HTMLElement | null
  hash: () => boolean
}) {
  const elements = new Map<string, HTMLElement>()
  const active = ref<string | undefined>()
  let scroller: HTMLElement | Window | undefined
  let target: string | undefined
  let pendingHash: string | undefined
  let settleTimer: ReturnType<typeof setTimeout> | undefined
  let frame = 0

  function register(key: string, element: HTMLElement) {
    elements.set(key, element)
    if (pendingHash === key) {
      pendingHash = undefined
      void nextTick(() => scrollTo(key, { behavior: 'instant', hash: false }))
    } else {
      schedule()
    }
    return () => {
      if (elements.get(key) === element) {
        elements.delete(key)
      }
      schedule()
    }
  }

  function scrollTo(key: string, options: ScrollToOptions = {}) {
    const element = elements.get(key)
    if (!element) {
      return false
    }
    target = key
    active.value = key
    element.scrollIntoView?.({
      behavior: options.behavior ?? (prefersReducedMotion() ? 'instant' : 'smooth'),
      block: 'start',
    })
    if (options.focus) {
      element
        .querySelector<HTMLElement>('[data-form-page-section-title]')
        ?.focus({ preventScroll: true })
    }
    if (options.hash ?? params.hash()) {
      writeHash(key)
    }
    settleSoon()
    return true
  }

  function settleSoon() {
    clearTimeout(settleTimer)
    settleTimer = setTimeout(() => {
      target = undefined
      update()
    }, SCROLL_SETTLE_MS)
  }

  function onScroll() {
    // While a programmatic scroll runs, the entry clicked stays active until it settles.
    if (target) {
      settleSoon()
      return
    }
    schedule()
  }

  // Only reached from mounted hooks and DOM events, so always on the client.
  function schedule() {
    if (frame) {
      return
    }
    frame = requestAnimationFrame(() => {
      frame = 0
      update()
    })
  }

  function update() {
    if (target) {
      return
    }
    const next = findActive()
    if (next !== undefined) {
      active.value = next
    }
  }

  function findActive() {
    const keys = params.sections.value
      .map((section) => section.key)
      .filter((key) => elements.has(key))
    if (!keys.length) {
      return undefined
    }
    if (isScrolledToEnd()) {
      return keys.at(-1)
    }
    const line = scroller instanceof HTMLElement ? scroller.getBoundingClientRect().top : 0
    let current = keys[0]
    for (const key of keys) {
      const element = elements.get(key)
      if (!element) {
        continue
      }
      const margin = Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0
      if (element.getBoundingClientRect().top - margin > line + ACTIVATION_SLACK) {
        break
      }
      current = key
    }
    return current
  }

  function isScrolledToEnd() {
    const box = scroller instanceof HTMLElement ? scroller : document.scrollingElement
    if (!box || box.scrollHeight <= box.clientHeight) {
      return false
    }
    return box.scrollTop + box.clientHeight >= box.scrollHeight - 1
  }

  function onHashChange() {
    const key = readHash()
    if (key && elements.has(key)) {
      scrollTo(key, { hash: false })
    }
  }

  onMounted(() => {
    scroller = findScroller(params.root())
    scroller.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('hashchange', onHashChange)
    const key = params.hash() ? readHash() : undefined
    if (key && elements.has(key)) {
      void nextTick(() => scrollTo(key, { behavior: 'instant', hash: false }))
    } else {
      pendingHash = key
      schedule()
    }
  })

  onBeforeUnmount(() => {
    scroller?.removeEventListener('scroll', onScroll)
    window.removeEventListener('hashchange', onHashChange)
    clearTimeout(settleTimer)
    if (frame) {
      cancelAnimationFrame(frame)
    }
  })

  return { active, register, scrollTo }
}

/** The element itself or its nearest ancestor that scrolls vertically, else the window. */
function findScroller(element: HTMLElement | null): HTMLElement | Window {
  for (let node = element; node; node = node.parentElement) {
    if (/auto|scroll/u.test(getComputedStyle(node).overflowY)) {
      return node
    }
  }
  return window
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
}

function readHash() {
  const hash = window.location.hash.slice(1)
  return hash ? decodeURIComponent(hash) : undefined
}

/** Replaces the hash without a history entry or a router navigation. */
function writeHash(key: string) {
  const url = new URL(window.location.href)
  url.hash = key
  window.history.replaceState(window.history.state, '', url)
}
