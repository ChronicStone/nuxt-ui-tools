import type { FormText, FormValue } from '../types'
import { invokeFormFunction, isFunction, isNumber, isString } from './predicate'

export function resolveFormText(text: FormText | undefined) {
  if (isFunction(text)) return String(text())
  if (isNumber(text)) return String(text)
  return text
}

export function resolveFormBoundaryText(value: FormValue) {
  if (isString(value)) return value
  if (isNumber(value)) return String(value)
  if (isFunction(value)) {
    const resolved = invokeFormFunction(value)
    return isString(resolved) || isNumber(resolved) ? String(resolved) : undefined
  }
  return undefined
}
