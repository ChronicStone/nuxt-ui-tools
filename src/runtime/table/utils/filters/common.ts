import { isArray, isObject } from '../../../shared/utils/predicate'
import { resolveTextValue } from '../../../shared/utils/render'
import type {
  TableDateFilterDefinition,
  TableQueryStateFilterRule,
  TableTextValue,
  TableUiFilterDefinition,
} from '../../types'

type DateRangeLike = {
  from?: unknown
  to?: unknown
}

export function getFilterLabelText(options: {
  label: TableUiFilterDefinition['label'] | (() => unknown)
}) {
  if (typeof options.label === 'string') return options.label

  const resolved = options.label()
  return typeof resolved === 'string' || typeof resolved === 'number' ? String(resolved) : ''
}

export function getFilterTextValue(options: {
  value: TableTextValue | undefined
  fallback?: string
}) {
  return resolveTextValue(options.value, options.fallback)
}

export function getFilterRuleValue(options: { rule?: TableQueryStateFilterRule }) {
  return options.rule?.value
}

export function getFilterPathValues(options: { source: unknown; key: string }): unknown[] {
  return flattenFilterValues({
    value: readFilterPathValue({
      source: options.source,
      key: options.key,
    }),
  })
}

export function readFilterPathValue(options: { source: unknown; key: string }): unknown {
  return options.key.split('.').reduce<unknown>((current, segment) => {
    if (isArray(current)) {
      return current.map((item) =>
        item != null && typeof item === 'object'
          ? (item as Record<string, unknown>)[segment]
          : undefined,
      )
    }

    if (!current || typeof current !== 'object') {
      return undefined
    }

    return (current as Record<string, unknown>)[segment]
  }, options.source)
}

export function flattenFilterValues(options: { value: unknown }): unknown[] {
  if (isArray(options.value)) {
    return options.value.flatMap((item) =>
      flattenFilterValues({
        value: item,
      }),
    )
  }

  if (options.value == null) {
    return []
  }

  return [options.value]
}

export function isDateRangeValue(options: { value: unknown }): options is { value: DateRangeLike } {
  if (!options.value || !isObject(options.value) || isArray(options.value)) {
    return false
  }

  return 'from' in options.value || 'to' in options.value
}

export function toDateFilterValue(options: {
  definition: TableDateFilterDefinition
  value: unknown
}) {
  if (options.value instanceof Date) {
    return options.value
  }

  if (typeof options.value === 'string' || typeof options.value === 'number') {
    const date = new Date(options.value)
    return Number.isNaN(date.getTime()) ? undefined : date
  }

  const rangeValue = getDateRangeValue({
    value: options.value,
  })

  if (rangeValue) {
    const from = toMaybeDate({
      value: rangeValue.from,
    })

    return from && !Number.isNaN(from.getTime()) ? from : undefined
  }

  return undefined
}

export function formatFilterDate(options: { value: Date }) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(options.value)
}

export function isFilterValueSelected(options: { values: unknown[]; candidate: unknown }) {
  return options.values.some((value) =>
    areFilterValuesEqual({ left: value, right: options.candidate }),
  )
}

export function getDateRangeValue(options: { value: unknown }) {
  return isDateRangeValue({ value: options.value }) ? (options.value as DateRangeLike) : undefined
}

type NumberRangeLike = {
  from?: number
  to?: number
}

function isNumberRangeValue(options: { value: unknown }): options is { value: NumberRangeLike } {
  if (!options.value || !isObject(options.value) || isArray(options.value)) {
    return false
  }

  return 'from' in options.value || 'to' in options.value
}

export function getNumberRangeValue(options: { value: unknown }) {
  return isNumberRangeValue({ value: options.value })
    ? (options.value as NumberRangeLike)
    : undefined
}

export function formatFilterNumber(options: { value: number }) {
  return new Intl.NumberFormat('en-US').format(options.value)
}

export function toMaybeNumber(options: { value: unknown }): number | undefined {
  if (typeof options.value === 'number') {
    return options.value
  }

  if (typeof options.value === 'string') {
    const n = Number(options.value)
    return Number.isNaN(n) ? undefined : n
  }

  return undefined
}

export function toMaybeDate(options: { value: unknown }) {
  if (options.value instanceof Date) {
    return options.value
  }

  if (typeof options.value === 'string' || typeof options.value === 'number') {
    const date = new Date(options.value)
    return Number.isNaN(date.getTime()) ? undefined : date
  }

  return undefined
}

function areFilterValuesEqual(options: { left: unknown; right: unknown }) {
  if (options.left instanceof Date || options.right instanceof Date) {
    const left =
      options.left instanceof Date
        ? options.left
        : options.left != null
          ? new Date(String(options.left))
          : undefined
    const right =
      options.right instanceof Date
        ? options.right
        : options.right != null
          ? new Date(String(options.right))
          : undefined

    return left?.getTime() === right?.getTime()
  }

  return String(options.left) === String(options.right)
}
