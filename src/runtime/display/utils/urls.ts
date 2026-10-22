import { isString } from '../../shared/utils/predicate'
import type { DisplayUrl } from '../types'

/** The address of a link, calling it when it is a function. */
export async function resolveDisplayUrl(source: DisplayUrl) {
  return isString(source) ? source : await source()
}

/**
 * Opens a link in a new tab. A function's tab opens during the click, so popup blockers let it
 * through, and follows the address once it resolves; it closes again if the address fails.
 */
export async function openDisplayUrl(source: DisplayUrl) {
  if (isString(source)) {
    window.open(source, '_blank', 'noopener')
    return
  }
  const tab = window.open('about:blank', '_blank')
  try {
    const url = await source()
    if (!tab) {
      window.open(url, '_blank', 'noopener')
      return
    }
    tab.opener = null
    tab.location.href = url
  } catch (error) {
    tab?.close()
    throw error
  }
}

/** Downloads a link under `name`, resolving it first when it is a function. */
export async function downloadDisplayUrl(source: DisplayUrl, name?: string) {
  const anchor = document.createElement('a')
  anchor.href = await resolveDisplayUrl(source)
  anchor.rel = 'noopener'
  anchor.target = '_blank'
  if (name) anchor.download = name
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
}
