import type { FormText, FormValue } from '../types'
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

/** Resolves field copy that is static, lazy, or computed from the field callback parameters. */
export function resolveFieldText(text: FormValue, params: FormValue) {
  return resolveFormBoundaryText(isFunction(text) ? invokeFormFunction(text, [params]) : text)
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

const DESCRIPTION_DISPLAYS = ['inline', 'tooltip', 'modal'] as const

export function resolveFieldDescription(
  description: FormValue,
  params: FormValue,
): ResolvedFieldDescription | undefined {
  const value = isFunction(description) ? invokeFormFunction(description, [params]) : description
  if (isRecord(value) && 'text' in value) {
    const text = resolveFormBoundaryText(value.text)
    if (!text) {
      return undefined
    }
    return {
      display: DESCRIPTION_DISPLAYS.find((display) => display === value.display) ?? 'inline',
      text,
      title: resolveFormBoundaryText(value.title),
    }
  }
  const text = resolveFormBoundaryText(value)
  return text ? { display: 'inline', text } : undefined
}
