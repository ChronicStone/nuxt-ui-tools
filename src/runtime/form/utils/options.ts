import { isProxy } from 'vue'

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

/**
 * Normalized options, keyed by the option object and its keys. Every row of an array shares the
 * option objects of the same query or list, so each is normalized once rather than once per row.
 */
const normalizedOptions = new WeakMap<object, Map<string, ResolvedFormOption>>()

export function normalizeOptionItems(
  options: readonly FormValue[] | undefined,
  keys: FormOptionKeys = {},
) {
  const signature = `${keys.value ?? ''}|${keys.label ?? ''}|${keys.children ?? ''}`
  return (options ?? []).map((option) => {
    if (!isStaticOption(option)) {
      return normalizeOptionItem(option, keys)
    }
    const cached = normalizedOptions.get(option)?.get(signature)
    if (cached) {
      return cached
    }
    const normalized = normalizeOptionItem(option, keys)
    const entries = normalizedOptions.get(option) ?? new Map<string, ResolvedFormOption>()
    entries.set(signature, normalized)
    normalizedOptions.set(option, entries)
    return normalized
  })
}

/**
 * A plain option whose texts are not functions: its normalized form cannot change without a new
 * object, unlike a reactive one or one whose label follows the locale.
 */
function isStaticOption(option: FormValue): option is FormOptionItem & object {
  return (
    isRecord(option) &&
    !isProxy(option) &&
    !Object.values(option).some(isFunction) &&
    !Array.isArray(option.children)
  )
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
