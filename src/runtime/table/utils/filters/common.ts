import { useUiToolsLocale } from '#ui-tools/i18n'

import { isArray, isNumber, isObject, isString } from '../../../shared/utils/predicate'
import { resolveTextValue } from '../../../shared/utils/render'
import type {
  TableDateFilterDefinition,
  TableQueryStateFilterRule,
  TableTextValue,
  RenderableType,
  TableUiFilterDefinition,
} from '../../types'

type DateRangeLike = {
  from?: unknown
  to?: unknown
}

export function getFilterLabelText(options: {
  label: TableTextValue | TableUiFilterDefinition['label'] | (() => RenderableType)
}) {
  if (isNumber(options.label)) return String(options.label)
  if (isString(options.label)) return options.label

  const resolved = options.label()
  return isString(resolved) || isNumber(resolved) ? String(resolved) : ''
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

export function readFilterPathValue<TSource>(options: { source: TSource; key: string }) {
  return options.key.split('.').reduce<unknown>((current, segment) => {
    if (isArray(current)) {
      return current.map((item) => (isObject(item) ? item[segment] : undefined))
    }

    if (!isObject(current)) {
      return undefined
    }

    return current[segment]
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

export function isDateRangeValue<TValue>(options: {
  value: TValue
}): options is { value: TValue & DateRangeLike } {
  if (!isObject(options.value) || isArray(options.value)) {
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

  if (isString(options.value) || isNumber(options.value)) {
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
  const { locale } = useUiToolsLocale()
  return new Intl.DateTimeFormat(locale.value.code, {
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

export function getDateRangeValue<TValue>(options: { value: TValue }) {
  return isDateRangeValue(options) ? options.value : undefined
}

type NumberRangeLike = {
  from?: number
  to?: number
}

function isNumberRangeValue<TValue>(options: {
  value: TValue
}): options is { value: TValue & NumberRangeLike } {
  if (!isObject(options.value) || isArray(options.value)) {
    return false
  }

  return (
    (!('from' in options.value) || isNumber(options.value.from)) &&
    (!('to' in options.value) || isNumber(options.value.to))
  )
}

export function getNumberRangeValue<TValue>(options: { value: TValue }) {
  return isNumberRangeValue(options) ? options.value : undefined
}

export function formatFilterNumber(options: { value: number }) {
  const { locale } = useUiToolsLocale()
  return new Intl.NumberFormat(locale.value.code).format(options.value)
}

export function toMaybeNumber(options: { value: unknown }): number | undefined {
  if (isNumber(options.value)) {
    return options.value
  }

  if (isString(options.value)) {
    const n = Number(options.value)
    return Number.isNaN(n) ? undefined : n
  }

  return undefined
}

export function toMaybeDate(options: { value: unknown }) {
  if (options.value instanceof Date) {
    return options.value
  }

  if (isString(options.value) || isNumber(options.value)) {
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
