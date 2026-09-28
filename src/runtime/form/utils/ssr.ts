import { getCurrentInstance, inject, ssrContextKey } from 'vue'

/**
 * True while the calling component renders on the server. The browser renders the same
 * components again when it hydrates the page and must produce the same markup, so work whose
 * result the server does not hand over, such as a fetch nobody awaits, waits for the browser.
 * Call it during setup.
 */
export function isServerRendering() {
  return getCurrentInstance() !== null && inject(ssrContextKey, null) !== null
}
