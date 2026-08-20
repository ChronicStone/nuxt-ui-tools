import type { FormValue } from '../types'
import type { FormApiDisplayMode } from '../types'
import type { FormDrawerConfig, FormFullscreenConfig, FormModalConfig } from '../types'
import { isRecord } from './path'
import { isFunction, isNumber, isString } from './predicate'
import { resolveFormText } from './text'

export function normalizeFormOverlayMode(value: FormValue): FormApiDisplayMode {
  if (value === 'drawer' || value === 'fullscreen') return value
  return 'modal'
}

export function getFormOverlayTitle(schema: FormValue) {
  return getFormOverlayText(schema, 'title')
}

export function getFormOverlayDescription(schema: FormValue) {
  return getFormOverlayText(schema, 'description')
}

export function getFormModalConfig(schema: FormValue): FormModalConfig | undefined {
  return getFormOverlayConfig(schema, 'modal')
}

export function getFormDrawerConfig(schema: FormValue): FormDrawerConfig | undefined {
  return getFormOverlayConfig(schema, 'drawer')
}

export function getFormFullscreenConfig(schema: FormValue): FormFullscreenConfig | undefined {
  return getFormOverlayConfig(schema, 'fullscreen')
}

function getFormOverlayConfig(schema: FormValue, key: 'modal'): FormModalConfig | undefined
function getFormOverlayConfig(schema: FormValue, key: 'drawer'): FormDrawerConfig | undefined
function getFormOverlayConfig(
  schema: FormValue,
  key: 'fullscreen',
): FormFullscreenConfig | undefined
function getFormOverlayConfig(schema: FormValue, key: 'modal' | 'drawer' | 'fullscreen') {
  if (!isRecord(schema)) return undefined
  const value = Object.getOwnPropertyDescriptor(schema, key)?.value
  return isRecord(value) ? value : undefined
}

function getFormOverlayText(schema: FormValue, key: 'title' | 'description') {
  if (!isRecord(schema)) return undefined

  const value = Object.getOwnPropertyDescriptor(schema, key)?.value
  if (!isString(value) && !isNumber(value) && !isFunction(value)) return undefined

  const resolvedValue = resolveFormText(value)
  return resolvedValue === undefined ? undefined : String(resolvedValue)
}
