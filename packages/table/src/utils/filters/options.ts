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
  options?: Array<{ label: string; value: string | number | boolean; count?: number }>
  selectedValues?: unknown[]
  deriveCounts?: boolean
  facetCounts?: Array<{ value: string | number | boolean; count: number }>
}) {
  if (options.definition.kind === 'boolean') {
    return createBooleanEntries({
      definition: options.definition,
      rows: options.rows,
      selectedValues: options.selectedValues ?? [],
      deriveCounts: options.deriveCounts ?? true,
      facetCounts: options.facetCounts ?? [],
    })
  }

  if (options.definition.kind !== 'option') {
    return []
  }

  const sourceOptions = options.options ?? options.definition.options ?? []

  return sourceOptions.map((entry) => ({
    label: getFilterLabelText({
      label: entry.label,
    }),
    value: entry.value,
    count: entry.count ?? (
      options.deriveCounts === false
        ? undefined
        : countOptionMatches({
            rows: options.rows,
            key: options.definition.key,
            candidate: entry.value,
          })
    ),
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
  deriveCounts: boolean
  facetCounts: Array<{ value: string | number | boolean; count: number }>
}) {
  const trueCount = options.facetCounts.find((entry) => entry.value === true)?.count
  const falseCount = options.facetCounts.find((entry) => entry.value === false)?.count

  return [
    {
      label: 'Yes',
      value: true,
      count: trueCount ?? (
        options.deriveCounts
        ? countOptionMatches({
            rows: options.rows,
            key: options.definition.key,
            candidate: true,
          })
        : undefined
      ),
      selected: isFilterValueSelected({
        values: options.selectedValues,
        candidate: true,
      }),
    },
    {
      label: 'No',
      value: false,
      count: falseCount ?? (
        options.deriveCounts
        ? countOptionMatches({
            rows: options.rows,
            key: options.definition.key,
            candidate: false,
          })
        : undefined
      ),
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
