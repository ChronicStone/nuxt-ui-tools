import { isFunction, isNumber, isString } from '../../shared/utils/predicate'
import type { DisplayContent, DisplayText } from '../types'

/** `undefined`, `null`, `false` and `''` count as empty; a render function never does. */
export function isDisplayContentEmpty(content: DisplayContent | undefined) {
  return content === undefined || content === null || content === '' || content === false
}

/** The string of a text or lazy text, or `undefined`. */
export function resolveDisplayText(value: DisplayText | undefined) {
  if (isFunction(value)) return String(value())
  if (isString(value) || isNumber(value)) return String(value)
  return undefined
}

/** The string of content that is plain text, such as a `value` a copy button can copy. */
export function displayContentText(content: DisplayContent | undefined) {
  if (isString(content) || isNumber(content)) return String(content)
  return undefined
}
