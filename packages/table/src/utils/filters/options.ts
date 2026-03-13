import type {
  TableBooleanFilterDefinition,
  TableUiFilterDefinition,
} from '../../types'
import {
  getFilterLabelText,
  getFilterPathValues,
  isFilterValueSelected,
} from './common'

export function resolveFilterOptionEntries(options: {
  definition: TableUiFilterDefinition
  rows: unknown[]
  options?: Array<{ label: string; value: string | number | boolean }>
  selectedValues?: unknown[]
}) {
  if (options.definition.kind === 'boolean') {
    return createBooleanEntries({
      definition: options.definition,
      rows: options.rows,
      selectedValues: options.selectedValues ?? [],
    })
  }

  if (options.definition.kind !== 'option') {
    return []
  }

  const sourceOptions = options.options ?? (
    Array.isArray(options.definition.options)
      ? options.definition.options
      : []
  )

  return sourceOptions.map((entry) => ({
    label: getFilterLabelText({
      label: entry.label,
    }),
    value: entry.value,
    count: countOptionMatches({
      rows: options.rows,
      key: options.definition.key,
      candidate: entry.value,
    }),
    selected: isFilterValueSelected({
      values: options.selectedValues ?? [],
      candidate: entry.value,
    }),
  }))
}

function createBooleanEntries(options: {
  definition: TableBooleanFilterDefinition
  rows: unknown[]
  selectedValues: unknown[]
}) {
  return [
    {
      label: 'Yes',
      value: true,
      count: countOptionMatches({
        rows: options.rows,
        key: options.definition.key,
        candidate: true,
      }),
      selected: isFilterValueSelected({
        values: options.selectedValues,
        candidate: true,
      }),
    },
    {
      label: 'No',
      value: false,
      count: countOptionMatches({
        rows: options.rows,
        key: options.definition.key,
        candidate: false,
      }),
      selected: isFilterValueSelected({
        values: options.selectedValues,
        candidate: false,
      }),
    },
  ]
}

function countOptionMatches(options: {
  rows: unknown[]
  key: string
  candidate: string | number | boolean
}) {
  return options.rows.reduce<number>((count, row) => {
    const values = getFilterPathValues({
      source: row,
      key: options.key,
    })

    return count + (
      values.some((value) =>
        isFilterValueSelected({
          values: [value],
          candidate: options.candidate,
        }),
      )
        ? 1
        : 0
    )
  }, 0)
}
