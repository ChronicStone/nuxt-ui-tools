import type { FormApiDisplayMode } from '../types'
import { isRecord } from './path'
import { resolveFormText } from './text'

export function normalizeFormOverlayMode(value: unknown): FormApiDisplayMode {
  if (value === 'drawer' || value === 'fullscreen') return value
  return 'modal'
}

export function getFormOverlayTitle(schema: unknown) {
  return getFormOverlayText(schema, 'title')
}

export function getFormOverlayDescription(schema: unknown) {
  return getFormOverlayText(schema, 'description')
}

function getFormOverlayText(schema: unknown, key: 'title' | 'description') {
  if (!isRecord(schema)) return undefined

  const value = Object.getOwnPropertyDescriptor(schema, key)?.value
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'function')
    return undefined

  const resolvedValue = resolveFormText(value)
  return resolvedValue === undefined ? undefined : String(resolvedValue)
}
