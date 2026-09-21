/**
 * One IntersectionObserver for every dashboard block instead of one per block. Each element gets a
 * one-shot callback: it runs the first time the element comes within 200px of the viewport, then the
 * element is unobserved. Only used on the client (blocks register from `onMounted`).
 */
const callbacks = new WeakMap<Element, () => void>()
let observer: IntersectionObserver | null = null

function getVisibilityObserver() {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const callback = callbacks.get(entry.target)
        unobserveDashboardVisibility(entry.target)
        callback?.()
      }
    },
    { rootMargin: '200px' },
  )
  return observer
}

function unobserveDashboardVisibility(element: Element) {
  callbacks.delete(element)
  observer?.unobserve(element)
}

/** Runs `callback` once, when `element` first nears the viewport. Returns a stop function. */
export function observeDashboardVisibility(element: Element, callback: () => void): () => void {
  callbacks.set(element, callback)
  getVisibilityObserver().observe(element)
  return () => unobserveDashboardVisibility(element)
}
