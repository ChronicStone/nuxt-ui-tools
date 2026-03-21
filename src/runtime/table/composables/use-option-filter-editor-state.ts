import { computed, ref, type ComputedRef, type Ref } from 'vue'

import type {
  TableFilterOperator,
  TableOptionFilterDefinition,
  TableOptionFilterOperator,
  TableResolvedFilterOptionEntry,
  TableSchemaView,
} from '../types'
import {
  collectSelectableDescendantValues,
  flattenFilterOptionEntries,
  flattenVisibleFilterOptionTree,
  resolveOptionFilterUi,
} from '../utils'
import type { UseTableDataReturn } from './use-table-data'
import { useTableFilterOptions } from './use-table-filter-options'
import type { useTableFilters } from './use-table-filters'

type PrimitiveFilterValue = string | number | boolean

export interface UseOptionFilterEditorStateParams {
  definition: TableOptionFilterDefinition
  operator: Ref<TableOptionFilterOperator>
  selectedValues: Ref<PrimitiveFilterValue[]>
  searchQuery: Ref<string>
  active?: Ref<boolean>
  ready?: Ref<boolean>
  filters: ReturnType<typeof useTableFilters>
  queryContent: Pick<UseTableDataReturn, 'facets' | 'requestContext'>
  schema: ComputedRef<TableSchemaView>
  setSelectedValues: (values: PrimitiveFilterValue[]) => void
}

export function useOptionFilterEditorState(options: UseOptionFilterEditorStateParams) {
  const expandedIds = ref<Set<string>>(new Set())

  const optionSource = useTableFilterOptions({
    definition: options.definition,
    searchQuery: options.searchQuery,
    active: options.active,
    ready: options.ready,
    filters: options.filters,
    queryContent: options.queryContent,
    schema: options.schema,
  })

  const filterUi = computed(() =>
    resolveOptionFilterUi(options.definition, options.operator.value),
  )

  const displayEntries = computed(() =>
    optionSource.filteredEntries.value.map((entry) => ({
      ...entry,
      icon: resolveRowIcon({
        entry,
        filterUi: filterUi.value,
      }),
      selected:
        entry.value != null &&
        options.selectedValues.value.some((value) => String(value) === String(entry.value)),
    })),
  )

  const displayTreeEntries = computed(() =>
    mapSelectedTreeEntries({
      entries: optionSource.filteredTreeEntries.value,
      selectedValues: options.selectedValues.value,
      filterUi: filterUi.value,
    }),
  )

  const effectiveExpandedIds = computed(
    () => new Set([...optionSource.searchExpandedIds.value, ...expandedIds.value]),
  )
  const selectedValueKeys = computed(() =>
    new Set(options.selectedValues.value.map(value => String(value))),
  )
  const flatTreeEntryMap = computed(() =>
    new Map(
      flattenFilterOptionEntries(displayTreeEntries.value)
        .map(entry => [entry.id, entry] as const),
    ),
  )

  const visibleTreeEntries = computed(() =>
    flattenVisibleFilterOptionTree({
      entries: displayTreeEntries.value,
      expandedIds: effectiveExpandedIds.value,
      selectable: filterUi.value.tree.selectable,
      branchSelection: filterUi.value.tree.branchSelection,
    }).map((entry) => {
      if (!entry.branchSelectable) {
        return {
          ...entry,
          expanded: effectiveExpandedIds.value.has(entry.id),
          indeterminate: false,
        }
      }

      const sourceEntry = flatTreeEntryMap.value.get(entry.id)
      const descendantValues = sourceEntry
        ? collectSelectableDescendantValues({
            entry: sourceEntry,
            selectable: filterUi.value.tree.selectable,
          })
        : []
      const selectedCount = descendantValues.filter(value =>
        selectedValueKeys.value.has(String(value)),
      ).length

      return {
        ...entry,
        selected: descendantValues.length > 0 && selectedCount === descendantValues.length,
        indeterminate: selectedCount > 0 && selectedCount < descendantValues.length,
        expanded: effectiveExpandedIds.value.has(entry.id),
      }
    }),
  )

  const flatRadioItems = computed(() =>
    displayEntries.value.map((entry) => ({
      label: entry.label,
      value: String(entry.value),
      count: filterUi.value.row.showCounts ? entry.count : undefined,
      icon: entry.icon,
      truncate: filterUi.value.row.truncate,
    })),
  )

  const flatRadioValue = computed({
    get: () => options.selectedValues.value[0] != null ? String(options.selectedValues.value[0]) : undefined,
    set: (value: string | undefined) => {
      if (value == null) return

      const match = displayEntries.value.find(entry => String(entry.value) === value)
      if (!match) return

      options.setSelectedValues([match.value])
    },
  })

  const treeRadioItems = computed(() =>
    visibleTreeEntries.value.map((entry) => ({
      id: entry.id,
      label: entry.label,
      value: entry.id,
      count: filterUi.value.row.showCounts ? entry.count : undefined,
      icon: entry.icon,
      truncate: filterUi.value.row.truncate,
      depth: entry.depth,
      expandable: entry.expandable,
      expanded: entry.expanded,
      selectable: entry.selectable,
      disabled: !entry.selectable,
    })),
  )

  const treeRadioValue = computed({
    get: () => {
      const selected = options.selectedValues.value[0]
      if (selected == null) return undefined

      return visibleTreeEntries.value.find(
        (entry) => entry.value != null && String(entry.value) === String(selected),
      )?.id
    },
    set: (value: string | undefined) => {
      if (value == null) return

      const match = visibleTreeEntries.value.find(entry => entry.id === value)
      if (!match || !match.selectable || match.value == null) return

      options.setSelectedValues([match.value])
    },
  })

  const triggerSummary = computed(() => {
    if (!options.selectedValues.value.length) return ''

    const labels = optionSource.sourceEntries.value
      .filter(entry =>
        entry.value != null &&
        options.selectedValues.value.some(value => String(value) === String(entry.value)),
      )
      .map(entry => entry.label)

    if (!labels.length) return `${options.selectedValues.value.length} selected`
    if (labels.length === 1) return labels[0]
    if (labels.length === 2) return labels.join(', ')
    return `${labels[0]}, ${labels[1]} +${labels.length - 2}`
  })

  function toggleValue(value: PrimitiveFilterValue) {
    const exists = options.selectedValues.value.some((entry) => String(entry) === String(value))

    if (filterUi.value.selection.mode === 'single') {
      if (exists) {
        if (!filterUi.value.selection.allowEmpty) return
        options.setSelectedValues([])
        return
      }

      options.setSelectedValues([value])
      return
    }

    if (exists) {
      if (!filterUi.value.selection.allowEmpty && options.selectedValues.value.length === 1) return

      options.setSelectedValues(
        options.selectedValues.value.filter((entry) => String(entry) !== String(value)),
      )
      return
    }

    if (
      filterUi.value.selection.max != null &&
      options.selectedValues.value.length >= filterUi.value.selection.max
    ) return

    options.setSelectedValues([...options.selectedValues.value, value])
  }

  function toggleTreeEntry(entry: {
    value?: PrimitiveFilterValue
    selectable: boolean
    branchSelectable?: boolean
    expandable: boolean
    id: string
  }) {
    if (entry.branchSelectable) {
      toggleBranchSelection(entry.id)
      return
    }

    if (!entry.selectable) {
      if (entry.expandable) toggleExpanded(entry.id)
      return
    }

    if (entry.value == null) return
    toggleValue(entry.value)
  }

  function toggleExpanded(id: string) {
    const next = new Set(expandedIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    expandedIds.value = next
  }

  function toggleBranchSelection(id: string) {
    if (filterUi.value.selection.mode !== 'multiple') return

    const entry = flatTreeEntryMap.value.get(id)
    if (!entry) return

    const descendantValues = collectSelectableDescendantValues({
      entry,
      selectable: filterUi.value.tree.selectable,
    })
    if (!descendantValues.length) {
      if (entry.children.length) toggleExpanded(id)
      return
    }

    const currentKeys = selectedValueKeys.value
    const allSelected = descendantValues.every(value => currentKeys.has(String(value)))

    if (allSelected) {
      const nextValues = options.selectedValues.value.filter(
        (value) => !descendantValues.some(descendant => String(descendant) === String(value)),
      )

      if (!filterUi.value.selection.allowEmpty && !nextValues.length) return
      options.setSelectedValues(nextValues)
      return
    }

    const missingValues = descendantValues.filter(value => !currentKeys.has(String(value)))
    const nextValues = [...options.selectedValues.value, ...missingValues]

    if (
      filterUi.value.selection.max != null &&
      nextValues.length > filterUi.value.selection.max
    ) return

    options.setSelectedValues(nextValues)
  }

  function resetExpandedIds() {
    expandedIds.value = new Set()
  }

  return {
    optionSource,
    filterUi,
    displayEntries,
    visibleTreeEntries,
    flatRadioItems,
    flatRadioValue,
    treeRadioItems,
    treeRadioValue,
    triggerSummary,
    toggleValue,
    toggleTreeEntry,
    toggleExpanded,
    resetExpandedIds,
  }
}

function resolveRowIcon(options: {
  entry: { label: string; value?: PrimitiveFilterValue; count?: number; icon?: string }
  filterUi: ReturnType<typeof resolveOptionFilterUi>
}) {
  if (options.entry.value == null) return options.entry.icon

  return options.filterUi.row.getIcon?.({
    label: options.entry.label,
    value: options.entry.value,
    count: options.entry.count,
    ...(options.entry.icon ? { icon: options.entry.icon } : {}),
  }) ?? options.entry.icon
}

function mapSelectedTreeEntries(options: {
  entries: TableResolvedFilterOptionEntry[]
  selectedValues: PrimitiveFilterValue[]
  filterUi: ReturnType<typeof resolveOptionFilterUi>
}): TableResolvedFilterOptionEntry[] {
  return options.entries.map((entry) => ({
    ...entry,
    icon: resolveRowIcon({
      entry,
      filterUi: options.filterUi,
    }),
    selected:
      entry.value != null &&
      options.selectedValues.some((value) => String(value) === String(entry.value)),
    children: mapSelectedTreeEntries({
      entries: entry.children,
      selectedValues: options.selectedValues,
      filterUi: options.filterUi,
    }),
  }))
}
