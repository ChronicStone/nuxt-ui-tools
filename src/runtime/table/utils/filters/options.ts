import { useUiToolsLocale } from '#ui-tools/i18n'

import { isNumber } from '../../../shared/utils/predicate'
import type {
  TableBooleanFilterDefinition,
  TableFilterOptionEntry,
  TableResolvedFilterOptionEntry,
  TableUiFilterDefinition,
} from '../../types'
import {
  getFilterLabelText,
  getFilterPathValues,
  getFilterTextValue,
  isFilterValueSelected,
} from './common'

export function resolveFilterOptionEntries(options: {
  definition: TableUiFilterDefinition
  rows: unknown[]
  options?: readonly TableFilterOptionEntry[]
  selectedValues?: unknown[]
  deriveCounts?: boolean
  facetCounts?: { value: string | number | boolean; count: number }[]
  missingCountFallback?: number
}) {
  if (options.definition.kind === 'boolean') {
    return createBooleanEntries({
      definition: options.definition,
      deriveCounts: options.deriveCounts ?? true,
      facetCounts: options.facetCounts ?? [],
      missingCountFallback: options.missingCountFallback,
      rows: options.rows,
      selectedValues: options.selectedValues ?? [],
    })
  }

  if (options.definition.kind !== 'option') {
    return []
  }

  const sourceOptions = options.options ?? options.definition.source?.options ?? []
  const countByValue = new Map(
    (options.facetCounts ?? []).map((entry) => [String(entry.value), entry.count] as const),
  )

  return resolveOptionEntryTree({
    entries: sourceOptions,
    getCount: (value) =>
      countByValue.get(String(value)) ??
      (options.deriveCounts === false || value == null
        ? options.missingCountFallback
        : countOptionMatches({
            candidate: value,
            key: options.definition.key,
            rows: options.rows,
          })),
    selectedValues: options.selectedValues ?? [],
  })
}

function createBooleanEntries(options: {
  definition: TableBooleanFilterDefinition
  rows: unknown[]
  selectedValues: unknown[]
  deriveCounts: boolean
  facetCounts: { value: string | number | boolean; count: number }[]
  missingCountFallback?: number
}) {
  const trueCount = options.facetCounts.find((entry) => entry.value === true)?.count
  const falseCount = options.facetCounts.find((entry) => entry.value === false)?.count

  return [
    {
      children: [],
      count:
        trueCount ??
        (options.deriveCounts
          ? countOptionMatches({
              candidate: true,
              key: options.definition.key,
              rows: options.rows,
            })
          : options.missingCountFallback),
      id: '0:true',
      label: booleanLabel(options.definition, true),
      selected: isFilterValueSelected({
        candidate: true,
        values: options.selectedValues,
      }),
      value: true,
    },
    {
      children: [],
      count:
        falseCount ??
        (options.deriveCounts
          ? countOptionMatches({
              candidate: false,
              key: options.definition.key,
              rows: options.rows,
            })
          : options.missingCountFallback),
      id: '1:false',
      label: booleanLabel(options.definition, false),
      selected: isFilterValueSelected({
        candidate: false,
        values: options.selectedValues,
      }),
      value: false,
    },
  ]
}

function resolveOptionEntryTree(options: {
  entries: readonly TableFilterOptionEntry[]
  selectedValues: unknown[]
  getCount: (value: string | number | boolean | undefined) => number | undefined
  parentId?: string
}): TableResolvedFilterOptionEntry[] {
  return options.entries.map((entry, index) => {
    const idPart = entry.value == null ? `group-${index}` : `${index}:${String(entry.value)}`
    const id = options.parentId ? `${options.parentId}/${idPart}` : idPart
    const children = resolveOptionEntryTree({
      entries: entry.children ?? [],
      getCount: options.getCount,
      parentId: id,
      selectedValues: options.selectedValues,
    })
    const derivedCount = options.getCount(entry.value)
    const selected =
      entry.value == null
        ? false
        : isFilterValueSelected({
            candidate: entry.value,
            values: options.selectedValues,
          })

    return {
      children,
      color: entry.color,
      count: entry.count ?? sumChildCounts(children) ?? derivedCount,
      icon: entry.icon,
      id,
      label: getFilterLabelText({
        label: entry.label,
      }),
      selected,
      value: entry.value,
    }
  })
}

function sumChildCounts(entries: TableResolvedFilterOptionEntry[]) {
  const counts = entries.map((entry) => entry.count).filter(isNumber)

  if (!counts.length) {
    return undefined
  }
  return counts.reduce((total, count) => total + count, 0)
}

function countOptionMatches(options: {
  rows: unknown[]
  key: string
  candidate: string | number | boolean
}) {
  return options.rows.reduce<number>((count, row) => {
    const values = getFilterPathValues({
      key: options.key,
      source: row,
    })

    return (
      count +
      (values.some((value) =>
        isFilterValueSelected({
          candidate: options.candidate,
          values: [value],
        }),
      )
        ? 1
        : 0)
    )
  }, 0)
}

function booleanLabel(definition: TableBooleanFilterDefinition, value: boolean) {
  const { t } = useUiToolsLocale()
  const custom = value ? definition.editor?.labels?.true : definition.editor?.labels?.false
  return getFilterTextValue({
    fallback: t(value ? 'table.filters.booleans.true' : 'table.filters.booleans.false'),
    value: custom,
  })
}
