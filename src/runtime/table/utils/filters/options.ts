import type {
  TableBooleanFilterDefinition,
  TableFilterOptionEntry,
  TableResolvedFilterOptionEntry,
  TableUiFilterDefinition,
} from '../../types'
import { getFilterLabelText, getFilterPathValues, isFilterValueSelected } from './common'

export function resolveFilterOptionEntries(options: {
  definition: TableUiFilterDefinition
  rows: unknown[]
  options?: ReadonlyArray<TableFilterOptionEntry>
  selectedValues?: unknown[]
  deriveCounts?: boolean
  facetCounts?: Array<{ value: string | number | boolean; count: number }>
  missingCountFallback?: number
}) {
  if (options.definition.kind === 'boolean') {
    return createBooleanEntries({
      definition: options.definition,
      rows: options.rows,
      selectedValues: options.selectedValues ?? [],
      deriveCounts: options.deriveCounts ?? true,
      facetCounts: options.facetCounts ?? [],
      missingCountFallback: options.missingCountFallback,
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
    selectedValues: options.selectedValues ?? [],
    getCount: (value) =>
      countByValue.get(String(value)) ??
      (options.deriveCounts === false || value == null
        ? options.missingCountFallback
        : countOptionMatches({
            rows: options.rows,
            key: options.definition.key,
            candidate: value,
          })),
  })
}

function createBooleanEntries(options: {
  definition: TableBooleanFilterDefinition
  rows: unknown[]
  selectedValues: unknown[]
  deriveCounts: boolean
  facetCounts: Array<{ value: string | number | boolean; count: number }>
  missingCountFallback?: number
}) {
  const trueCount = options.facetCounts.find((entry) => entry.value === true)?.count
  const falseCount = options.facetCounts.find((entry) => entry.value === false)?.count

  return [
    {
      id: '0:true',
      label: 'Yes',
      value: true,
      count:
        trueCount ??
        (options.deriveCounts
          ? countOptionMatches({
              rows: options.rows,
              key: options.definition.key,
              candidate: true,
            })
          : options.missingCountFallback),
      selected: isFilterValueSelected({
        values: options.selectedValues,
        candidate: true,
      }),
      children: [],
    },
    {
      id: '1:false',
      label: 'No',
      value: false,
      count:
        falseCount ??
        (options.deriveCounts
          ? countOptionMatches({
              rows: options.rows,
              key: options.definition.key,
              candidate: false,
            })
          : options.missingCountFallback),
      selected: isFilterValueSelected({
        values: options.selectedValues,
        candidate: false,
      }),
      children: [],
    },
  ]
}

function resolveOptionEntryTree(options: {
  entries: ReadonlyArray<TableFilterOptionEntry>
  selectedValues: unknown[]
  getCount: (value: string | number | boolean | undefined) => number | undefined
  parentId?: string
}): TableResolvedFilterOptionEntry[] {
  return options.entries.map((entry, index) => {
    const idPart = entry.value == null ? `group-${index}` : `${index}:${String(entry.value)}`
    const id = options.parentId
      ? `${options.parentId}/${idPart}`
      : idPart
    const children = resolveOptionEntryTree({
      entries: entry.children ?? [],
      selectedValues: options.selectedValues,
      getCount: options.getCount,
      parentId: id,
    })
    const derivedCount = options.getCount(entry.value)
    const selected =
      entry.value == null
        ? false
        : isFilterValueSelected({
            values: options.selectedValues,
            candidate: entry.value,
          })

    return {
      id,
      label: getFilterLabelText({
        label: entry.label,
      }),
      value: entry.value,
      icon: entry.icon,
      count: entry.count ?? sumChildCounts(children) ?? derivedCount,
      selected,
      children,
    }
  })
}

function sumChildCounts(entries: TableResolvedFilterOptionEntry[]) {
  const counts = entries
    .map(entry => entry.count)
    .filter((count): count is number => typeof count === 'number')

  if (!counts.length) return undefined
  return counts.reduce((total, count) => total + count, 0)
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

    return (
      count +
      (values.some((value) =>
        isFilterValueSelected({
          values: [value],
          candidate: options.candidate,
        }),
      )
        ? 1
        : 0)
    )
  }, 0)
}
