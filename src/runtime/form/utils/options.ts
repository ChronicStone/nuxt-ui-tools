import type { FormFieldCallbackParams, FormOptionItem, FormOptionValue } from '../types'
import { isRecord } from './path'
import { resolveFormText } from './text'

export interface FormOptionKeys {
  value?: string
  label?: string
  children?: string
}

export interface ResolvedFormOption {
  value: FormOptionValue
  label: string
  description?: string
  disabled?: boolean
  children?: readonly ResolvedFormOption[]
}

export function normalizeOptionItem(
  option: unknown,
  keys: FormOptionKeys = {},
): ResolvedFormOption {
  if (isRecord(option)) {
    const rawValue = readOptionProperty(option, keys.value ?? 'value')
    const fallbackValue = typeof rawValue === 'undefined' ? option.key : rawValue
    const rawChildren = readOptionProperty(option, keys.children ?? 'children')
    const rawDescription = readOptionProperty(option, 'description')
    const children = Array.isArray(rawChildren)
      ? rawChildren.map((child) => normalizeOptionItem(child, keys))
      : undefined
    const value = normalizeOptionValue(fallbackValue)
    return {
      value,
      label: resolveFormText(readOptionProperty(option, keys.label ?? 'label')) ?? String(value),
      description: isFormText(rawDescription) ? resolveFormText(rawDescription) : undefined,
      disabled: option.disabled === true,
      ...(children ? { children } : {}),
    }
  }

  return {
    value: normalizeOptionValue(option),
    label: String(option),
  }
}

export function normalizeOptionItems(
  options: readonly unknown[] | undefined,
  keys: FormOptionKeys = {},
) {
  return (options ?? []).map((option) => normalizeOptionItem(option, keys))
}

export function formOptionKey(value: FormOptionValue) {
  return `${typeof value}:${String(value)}`
}

export function flattenResolvedOptions(
  options: readonly ResolvedFormOption[],
): readonly ResolvedFormOption[] {
  return options.flatMap((option) => [option, ...flattenResolvedOptions(option.children ?? [])])
}

export function mergeResolvedOptions(
  ...collections: readonly (readonly ResolvedFormOption[])[]
): readonly ResolvedFormOption[] {
  const seen = new Set<string>()
  return collections.flatMap((collection) =>
    collection.filter((option) => {
      const key = formOptionKey(option.value)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }),
  )
}

export function normalizeOptionSelection(value: unknown, options: readonly ResolvedFormOption[]) {
  const validKeys = new Set(
    flattenResolvedOptions(options).map((option) => formOptionKey(option.value)),
  )
  if (Array.isArray(value)) {
    const selected = new Set<string>()
    return value.filter((item) => {
      if (!isOptionValue(item)) return false
      const key = formOptionKey(item)
      if (!validKeys.has(key) || selected.has(key)) return false
      selected.add(key)
      return true
    })
  }
  if (value === null || typeof value === 'undefined') return value
  return isOptionValue(value) && validKeys.has(formOptionKey(value)) ? value : null
}

export function resolveOptionSource(
  source: unknown,
  params: FormFieldCallbackParams,
): readonly FormOptionItem[] {
  if (!source) return []
  if (Array.isArray(source)) return source
  if (typeof source === 'function') {
    const value = source(params)
    if (Array.isArray(value)) return value
    return []
  }
  return []
}

function normalizeOptionValue(value: unknown): FormOptionValue {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    return value
  return String(value)
}

function readOptionProperty(option: Record<string, unknown>, key: string) {
  return Object.getOwnPropertyDescriptor(option, key)?.value
}

function isFormText(value: unknown): value is string | number | (() => string | number) {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'function'
}

function isOptionValue(value: unknown): value is FormOptionValue {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}
