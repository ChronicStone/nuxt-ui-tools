import type {
  FormValue,
  FormField,
  FormFieldCallbackParams,
  FormOptionItem,
  FormOptionValue,
} from '../types'
import { createFormFieldInstance } from './field-instance'
import { isRecord } from './path'
import { isBoolean, isFunction, isNumber, isString, isUndefined } from './predicate'
import { resolveFormText } from './text'

export interface FormOptionKeys {
  value?: string
  label?: string
  children?: string
  /**
   * Property holding the heading an option is listed under. Options are not grouped without it:
   * a `group` property is never read unless it is mapped here.
   */
  group?: string
}

/** Property inline options hold their heading in when the field does not map another one. */
const DEFAULT_GROUP_KEY = 'group'

export interface ResolvedFormOption {
  value: FormOptionValue
  label: string
  description?: string
  disabled?: boolean
  icon?: string
  /** Heading the option is listed under, for the fields that group their options. */
  group?: string
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
    const rawGroup = keys.group ? readOptionProperty(option, keys.group) : undefined
    const children = Array.isArray(rawChildren)
      ? rawChildren.map((child) => normalizeOptionItem(child, keys))
      : undefined
    const lazy = option.isLeaf === false || option.hasChildren === true
    const value = normalizeOptionValue(fallbackValue)
    const rawIcon = readOptionProperty(option, 'icon')
    const normalized: ResolvedFormOption = {
      description: isFormText(rawDescription) ? resolveFormText(rawDescription) : undefined,
      disabled: option.disabled === true,
      group: isFormText(rawGroup) ? resolveFormText(rawGroup) : undefined,
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

/**
 * The `options` of a field as authored: its array, function or query source, whether given
 * directly or inside a `source` property.
 */
export function readOptionSource(field: FormField): FormValue {
  const options = Object.getOwnPropertyDescriptor(field, 'options')?.value
  return isRecord(options) && 'source' in options ? options.source : options
}

/**
 * Property the options of a field hold their heading in, for the field kinds that list options
 * under headings. The field's `groupKey` names it, read statically from the definition like
 * `labelKey` and `valueKey`. Without it, options written inline in the schema group by their
 * `group`, the way a literal option is authored. The records a function, a promise or a query
 * returns belong to the author's data, so a `group` they happen to carry is not read until
 * `groupKey` maps it. `groupKey: false` opts out.
 */
export function resolveOptionGroupKey(field: FormField): string | undefined {
  if (!createFormFieldInstance(field).capability.has('optionGroups')) return undefined
  const mapped = Object.getOwnPropertyDescriptor(field, 'groupKey')?.value
  if (mapped === false) return undefined
  if (isString(mapped) && mapped) return mapped
  return Array.isArray(readOptionSource(field)) ? DEFAULT_GROUP_KEY : undefined
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
