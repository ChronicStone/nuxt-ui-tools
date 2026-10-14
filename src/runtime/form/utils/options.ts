import type {
  FormValue,
  FormField,
  FormFieldCallbackParams,
  FormOptionAvatar,
  FormOptionChip,
  FormOptionChipColor,
  FormOptionItem,
  FormOptionValue,
  ResolvedFormOption,
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

export type { ResolvedFormOption } from '../types'

const CHIP_COLORS: readonly FormOptionChipColor[] = [
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'error',
  'neutral',
]

/** The one visual an option draws before its label: its icon, else its avatar, else its chip. */
export type OptionLeading = 'icon' | 'avatar' | 'chip'

const LEADING_PADDING = { lg: 'ps-10', md: 'ps-9', sm: 'ps-8', xl: 'ps-11', xs: 'ps-7' } as const

/**
 * Start padding of a select or auto-complete that draws the chosen option's visual in its leading
 * slot. Nuxt UI decides that padding from the slot once, so a visual that appears after mount (a
 * value picked later) would otherwise draw over the text.
 */
export function leadingVisualPadding(size: unknown) {
  return LEADING_PADDING[isLeadingSize(size) ? size : 'md']
}

function isLeadingSize(size: unknown): size is keyof typeof LEADING_PADDING {
  return isString(size) && Object.hasOwn(LEADING_PADDING, size)
}

export function resolveOptionLeading(option: ResolvedFormOption): OptionLeading | undefined {
  if (option.icon) return 'icon'
  if (option.avatar) return 'avatar'
  if (option.chip) return 'chip'
  return undefined
}

/**
 * Indent that lines the description of a radio or checkbox option up under its label: the width of
 * the leading visual (16px icon or chip box, 24px avatar) plus the 8px gap of the row.
 */
const DESCRIPTION_INDENT: Record<OptionLeading, string> = {
  avatar: 'ps-8',
  chip: 'ps-6',
  icon: 'ps-6',
}

export function resolveOptionDescriptionIndent(option: ResolvedFormOption): string | undefined {
  const leading = resolveOptionLeading(option)
  return leading ? DESCRIPTION_INDENT[leading] : undefined
}

export function normalizeOptionItem(
  option: FormValue,
  keys: FormOptionKeys = {},
): ResolvedFormOption {
  const item = isFormOptionItem(option) ? option : undefined
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
    const rawSuffix = readOptionProperty(option, 'suffix')
    const normalized: ResolvedFormOption = {
      avatar: normalizeOptionAvatar(readOptionProperty(option, 'avatar')),
      chip: normalizeOptionChip(readOptionProperty(option, 'chip')),
      description: isFormText(rawDescription) ? resolveFormText(rawDescription) : undefined,
      disabled: option.disabled === true,
      group: isFormText(rawGroup) ? resolveFormText(rawGroup) : undefined,
      icon: isString(rawIcon) ? rawIcon : undefined,
      item,
      label: resolveFormText(readOptionProperty(option, keys.label ?? 'label')) ?? String(value),
      suffix: isFormText(rawSuffix) ? resolveFormText(rawSuffix) : undefined,
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
    item,
    label: String(option),
    value: normalizeOptionValue(option),
  }
}

/** An option as authored: a primitive value, or a record that carries its own data. */
function isFormOptionItem(value: FormValue): value is FormOptionItem {
  return isOptionValue(value) || isRecord(value)
}

function normalizeOptionAvatar(raw: FormValue): FormOptionAvatar | undefined {
  if (!isRecord(raw)) return undefined
  const { alt, src, text } = raw
  return {
    alt: isString(alt) ? alt : undefined,
    src: isString(src) ? src : undefined,
    text: isString(text) ? text : undefined,
  }
}

function normalizeOptionChip(raw: FormValue): FormOptionChip | undefined {
  if (!isRecord(raw)) return undefined
  return { color: CHIP_COLORS.find((color) => color === raw.color) }
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

export interface OptionGroup<TItem> {
  /** Stable key of the group: its heading, or an empty string for the options without one. */
  key: string
  /** Heading shown above the options of the group; none for options that declare no group. */
  heading?: string
  /** The group's options, as the mutable list the Nuxt UI groups take. */
  items: TItem[]
}

/**
 * Lists options under their group headings. Headings follow the order in which they first appear
 * in `items`, and each keeps its options in their authored order. The options without a group form
 * one more group with no heading, placed where its first option appears. Without any group the
 * result is a single headingless group, so an ungrouped list renders as it always did.
 */
export function groupOptions<TItem extends { group?: string }>(
  items: readonly TItem[],
): readonly OptionGroup<TItem>[] {
  const groups = new Map<string, TItem[]>()
  for (const item of items) {
    const key = item.group?.trim() ?? ''
    const members = groups.get(key)
    if (members) members.push(item)
    else groups.set(key, [item])
  }
  if (groups.size === 0) return [{ items: [], key: '' }]
  return [...groups].map(([key, members]) => ({ heading: key || undefined, items: members, key }))
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

/** Item of a Nuxt UI menu: an option, or the heading (`type: 'label'`) the menu draws above a group. */
export type OptionMenuItem = ResolvedFormOption & { type?: 'label' }

function menuHeading(heading: string): OptionMenuItem {
  return { label: heading, type: 'label', value: '' }
}

/**
 * Items for the Nuxt UI menu of a select or auto-complete: the options as one flat list, or, when
 * some options belong to a group, one array per group with a heading item first. Nuxt UI draws
 * each array as a group and keeps a heading only while its group still has a match for the search.
 * The load-more row, when shown, is last and belongs to no group.
 */
export function toMenuItems(
  options: readonly ResolvedFormOption[],
  loadMore: { show: boolean; label: string },
): OptionMenuItem[] | OptionMenuItem[][] {
  const groups = groupOptions(options)
  if (!groups.some((group) => group.heading)) {
    return [...appendLoadMoreOption(options, loadMore.show, loadMore.label)]
  }
  const nested = groups.map((group) =>
    group.heading ? [menuHeading(group.heading), ...group.items] : group.items,
  )
  return loadMore.show ? [...nested, [...appendLoadMoreOption([], true, loadMore.label)]] : nested
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
