import { isString } from '../../shared/utils/predicate'
import type { DisplayLinkTarget } from '../types'

const ABSOLUTE = /^https?:\/\//iu

/** Whether a link leaves the app: an absolute http(s) address (route objects never do). */
export function isExternalLink<TTo>(to: TTo): to is TTo & string {
  return isString(to) && ABSOLUTE.test(to)
}

/**
 * Attributes of a block link: an absolute http(s) address opens in a new tab unless `target` says
 * otherwise, and a new tab never gets access to the app (`noopener noreferrer`).
 */
export function displayLinkAttrs(to: string, target?: DisplayLinkTarget | null) {
  const resolved =
    target === undefined ? (isExternalLink(to) ? '_blank' : undefined) : (target ?? undefined)
  return { rel: resolved === '_blank' ? 'noopener noreferrer' : undefined, target: resolved, to }
}
