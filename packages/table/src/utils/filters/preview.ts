import type {
  TableQueryStateFilterRule,
  TableUiFilterDefinition,
} from '../../types'
import {
  formatFilterDate,
  getDateRangeValue,
  toDateFilterValue,
  toMaybeDate,
} from './common'

export function buildFilterPreview(options: {
  definition: TableUiFilterDefinition
  rule?: TableQueryStateFilterRule
  optionEntries?: Array<{ label: string; value: string | number | boolean }>
}) {
  if (!options.rule) {
    return {
      active: false,
      count: 0,
      tags: [] as string[],
      summary: '',
    }
  }

  if (options.definition.kind === 'option' || options.definition.kind === 'boolean') {
    const values = Array.isArray(options.rule.value) ? options.rule.value : [options.rule.value]
    const labels = values.map((value) => resolveOptionPreviewLabel({
      definition: options.definition,
      optionEntries: options.optionEntries ?? [],
      value,
    }))

    if (labels.length <= 2 && labels.every((label) => label.length <= 16)) {
      return {
        active: true,
        count: labels.length,
        tags: labels,
        summary: '',
      }
    }

    return {
      active: true,
      count: labels.length,
      tags: [] as string[],
      summary: `${labels.length} selected`,
    }
  }

  if (options.definition.kind === 'date') {
    const range = getDateRangeValue({
      value: options.rule.value,
    })

    if (range && (range.from || range.to)) {
      const start = toMaybeDate({
        value: range.from,
      })
      const end = toMaybeDate({
        value: range.to,
      })

      return {
        active: true,
        count: [start, end].filter(Boolean).length,
        tags: [] as string[],
        summary: [start, end]
          .filter((value): value is Date => value instanceof Date)
          .map((value) => formatFilterDate({ value }))
          .join(' - '),
      }
    }

    const date = toDateFilterValue({
      definition: options.definition,
      value: options.rule.value,
    })

    return {
      active: Boolean(date),
      count: date ? 1 : 0,
      tags: [] as string[],
      summary: date ? formatFilterDate({ value: date }) : '',
    }
  }

  const summary = Array.isArray(options.rule.value)
    ? `${options.rule.value.length} selected`
    : String(options.rule.value ?? '')

  return {
    active: Boolean(summary),
    count: summary ? 1 : 0,
    tags: [] as string[],
    summary,
  }
}

function resolveOptionPreviewLabel(options: {
  definition: TableUiFilterDefinition
  optionEntries: Array<{ label: string; value: string | number | boolean }>
  value: unknown
}) {
  const matched = options.optionEntries.find((entry) => String(entry.value) === String(options.value))

  if (matched) {
    return matched.label
  }

  if (options.definition.kind === 'boolean') {
    return options.value ? 'Yes' : 'No'
  }

  return String(options.value ?? '')
}
