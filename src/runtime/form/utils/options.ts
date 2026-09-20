import type { FormValue, FormFieldCallbackParams, FormOptionItem, FormOptionValue } from '../types'
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
  icon?: string
  children?: readonly ResolvedFormOption[]
  /** True when the option has children that load on demand. */
  lazy?: boolean
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
    const lazy = option.isLeaf === false || option.hasChildren === true
    const value = normalizeOptionValue(fallbackValue)
    const rawIcon = readOptionProperty(option, 'icon')
    const normalized: ResolvedFormOption = {
      description: isFormText(rawDescription) ? resolveFormText(rawDescription) : undefined,
      disabled: option.disabled === true,
      icon: isString(rawIcon) ? rawIcon : undefined,
      label: resolveFormText(readOptionProperty(option, keys.label ?? 'label')) ?? String(value),
      value,
    }
    if (children) {
      normalized.children = children
    } else if (lazy) {
      normalized.children = []
    }
    if (lazy) {
      normalized.lazy = true
    }
    return normalized
  }

  return {
    label: String(option),
    value: normalizeOptionValue(option),
  }
}

export function normalizeOptionItems(
  options: readonly FormValue[] | undefined,
  keys: FormOptionKeys = {},
) {
  return (options ?? []).map((option) => normalizeOptionItem(option, keys))
}

export const LOAD_MORE_OPTION_VALUE = '__nut:load-more__'

export function isLoadMoreOption(item: FormValue) {
  return isRecord(item) && item.value === LOAD_MORE_OPTION_VALUE
}

export function appendLoadMoreOption(
  items: readonly ResolvedFormOption[],
  show: boolean,
  label: string,
): readonly ResolvedFormOption[] {
  if (!show) {
    return items
  }
  return [...items, { disabled: true, label, value: LOAD_MORE_OPTION_VALUE }]
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
      if (seen.has(key)) {
        return false
      }
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
      if (!isOptionValue(item)) {
        return false
      }
      const key = formOptionKey(item)
      if (!validKeys.has(key) || selected.has(key)) {
        return false
      }
      selected.add(key)
      return true
    })
  }
  if (value === null || isUndefined(value)) {
    return value
  }
  return isOptionValue(value) && validKeys.has(formOptionKey(value)) ? value : null
}

export function resolveOptionSource(
  source: FormValue,
  params: FormFieldCallbackParams,
): readonly FormOptionItem[] {
  if (!source) {
    return []
  }
  if (Array.isArray(source)) {
    return source
  }
  if (isFunction(source)) {
    const value = source(params)
    if (Array.isArray(value)) {
      return value
    }
    return []
  }
  return []
}

function normalizeOptionValue(value: FormValue): FormOptionValue {
  if (isString(value) || isNumber(value) || isBoolean(value)) {
    return value
  }
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
