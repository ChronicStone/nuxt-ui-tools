import type { FormValue } from '../types'
import type { FormFieldCallbackParams, FormOptionItem, FormOptionValue } from '../types'
import { isRecord } from './path'
import { isBoolean, isFunction, isNumber, isString, isUndefined } from './predicate'
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
  option: FormValue,
  keys: FormOptionKeys = {},
): ResolvedFormOption {
  if (isRecord(option)) {
    const rawValue = readOptionProperty(option, keys.value ?? 'value')
    const fallbackValue = isUndefined(rawValue) ? option.key : rawValue
    const rawChildren = readOptionProperty(option, keys.children ?? 'children')
    const rawDescription = readOptionProperty(option, 'description')
    const children = Array.isArray(rawChildren)
      ? rawChildren.map((child) => normalizeOptionItem(child, keys))
      : undefined
    const value = normalizeOptionValue(fallbackValue)
    const normalized: ResolvedFormOption = {
      value,
      label: resolveFormText(readOptionProperty(option, keys.label ?? 'label')) ?? String(value),
      description: isFormText(rawDescription) ? resolveFormText(rawDescription) : undefined,
      disabled: option.disabled === true,
    }
    if (children) normalized.children = children
    return normalized
  }

  return {
    value: normalizeOptionValue(option),
    label: String(option),
  }
}

export function normalizeOptionItems(
  options: readonly FormValue[] | undefined,
  keys: FormOptionKeys = {},
) {
  return (options ?? []).map((option) => normalizeOptionItem(option, keys))
}

export function formOptionKey(value: FormOptionValue) {
  const type = isString(value)
    ? 'string'
    : isNumber(value)
      ? 'number'
      : isBoolean(value)
        ? 'boolean'
        : 'unknown'
  return `${type}:${String(value)}`
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

export function normalizeOptionSelection(value: FormValue, options: readonly ResolvedFormOption[]) {
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
  if (value === null || isUndefined(value)) return value
  return isOptionValue(value) && validKeys.has(formOptionKey(value)) ? value : null
}

export function resolveOptionSource(
  source: FormValue,
  params: FormFieldCallbackParams,
): readonly FormOptionItem[] {
  if (!source) return []
  if (Array.isArray(source)) return source
  if (isFunction(source)) {
    const value = source(params)
    if (Array.isArray(value)) return value
    return []
  }
  return []
}

function normalizeOptionValue(value: FormValue): FormOptionValue {
  if (isString(value) || isNumber(value) || isBoolean(value)) return value
  return String(value)
}

function readOptionProperty(option: Record<string, FormValue>, key: string) {
  return Object.getOwnPropertyDescriptor(option, key)?.value
}

function isFormText(value: FormValue): value is string | number | (() => string | number) {
  return isString(value) || isNumber(value) || isFunction(value)
}

function isOptionValue(value: FormValue): value is FormOptionValue {
  return isString(value) || isNumber(value) || isBoolean(value)
}
