import type { FormFieldDescription, FormText, FormValue } from '../types'
import { isRecord } from './path'
import { invokeFormFunction, isFunction, isNumber, isString } from './predicate'

export function resolveFormText(text: FormText | undefined) {
  if (isFunction(text)) {
    return String(text())
  }
  if (isNumber(text)) {
    return String(text)
  }
  return text
}

export function resolveFormBoundaryText(value: FormValue) {
  if (isString(value)) {
    return value
  }
  if (isNumber(value)) {
    return String(value)
  }
  if (isFunction(value)) {
    const resolved = invokeFormFunction(value)
    return isString(resolved) || isNumber(resolved) ? String(resolved) : undefined
  }
}

export interface ResolvedFieldDescription {
  text: string
  display: 'inline' | 'tooltip' | 'modal'
  title?: string
}

export function resolveFieldDescription(
  value: FormText | FormFieldDescription | undefined,
): ResolvedFieldDescription | undefined {
  if (value === undefined) {
    return undefined
  }
  if (isDescriptionConfig(value)) {
    const text = resolveFormText(value.text)
    if (!text) {
      return undefined
    }
    return { display: value.display ?? 'inline', text, title: resolveFormText(value.title) }
  }
  const text = resolveFormText(value)
  return text ? { display: 'inline', text } : undefined
}

function isDescriptionConfig(
  value: FormText | FormFieldDescription,
): value is FormFieldDescription {
  return isRecord(value) && 'text' in value
}
