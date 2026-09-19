import { computed, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'

import { isNullish } from '../../shared/utils/predicate'
import type {
  TableFilterOptionEntry,
  TableOptionFilterDefinition,
  TableOptionFilterOperator,
  TableResolvedFilterOptionEntry,
  TableSchemaView,
} from '../types'
import {
  collectSelectedBranchIds,
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
  queryContent: Pick<UseTableDataReturn, 'facets' | 'facetsBaseContext'>
  schema: ComputedRef<TableSchemaView>
  setSelectedValues: (values: PrimitiveFilterValue[]) => void
}

export function useOptionFilterEditorState(options: UseOptionFilterEditorStateParams) {
  const expandedIds = ref<Set<string>>(new Set())

  const optionSource = useTableFilterOptions({
    active: options.active,
    definition: options.definition,
    filters: options.filters,
    queryContent: options.queryContent,
    ready: options.ready,
    schema: options.schema,
    searchQuery: options.searchQuery,
  })

  const filterUi = computed(() => resolveOptionFilterUi(options.definition, options.operator.value))

  const displayEntries = computed(() =>
    optionSource.filteredEntries.value.map((entry) => ({
      ...entry,
      icon: resolveRowIcon({
        entry,
        filterUi: filterUi.value,
      }),
      selected:
        !isNullish(entry.value) &&
        options.selectedValues.value.some((value) => String(value) === String(entry.value)),
    })),
  )

  const displayTreeEntries = computed(() =>
    mapSelectedTreeEntries({
      entries: optionSource.filteredTreeEntries.value,
      filterUi: filterUi.value,
      selectedValues: options.selectedValues.value,
    }),
  )
  const selectedExpandedIds = computed(
    () => new Set(collectSelectedBranchIds(displayTreeEntries.value)),
  )

  const effectiveExpandedIds = computed(
    () =>
      new Set([
        ...optionSource.searchExpandedIds.value,
        ...selectedExpandedIds.value,
        ...expandedIds.value,
      ]),
  )
  const selectedValueKeys = computed(
    () => new Set(options.selectedValues.value.map((value) => String(value))),
  )
  const flatTreeEntryMap = computed(
    () =>
      new Map(
        flattenFilterOptionEntries(displayTreeEntries.value).map(
          (entry) => [entry.id, entry] as const,
        ),
      ),
  )

  const visibleTreeEntries = computed(() =>
    flattenVisibleFilterOptionTree({
      branchSelection: filterUi.value.tree.branchSelection,
      entries: displayTreeEntries.value,
      expandedIds: effectiveExpandedIds.value,
      selectable: filterUi.value.tree.selectable,
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
      const selectedCount = descendantValues.filter((value) =>
        selectedValueKeys.value.has(String(value)),
      ).length

      return {
        ...entry,
        expanded: effectiveExpandedIds.value.has(entry.id),
        indeterminate: selectedCount > 0 && selectedCount < descendantValues.length,
        selected: descendantValues.length > 0 && selectedCount === descendantValues.length,
      }
    }),
  )

  const flatRadioItems = computed(() =>
    displayEntries.value.map((entry) => ({
      color: entry.color,
      count: filterUi.value.row.showCounts ? entry.count : undefined,
      icon: entry.icon,
      label: entry.label,
      truncate: filterUi.value.row.truncate,
      value: String(entry.value),
    })),
  )

  const flatRadioValue = computed({
    get: () =>
      isNullish(options.selectedValues.value[0])
        ? undefined
        : String(options.selectedValues.value[0]),
    set: (value: string | undefined) => {
      if (isNullish(value)) {
        return
      }

      const match = displayEntries.value.find((entry) => String(entry.value) === value)
      if (!match) {
        return
      }

      options.setSelectedValues([match.value])
    },
  })

  const treeRadioItems = computed(() =>
    visibleTreeEntries.value.map((entry) => ({
      color: entry.color,
      count: filterUi.value.row.showCounts ? entry.count : undefined,
      depth: entry.depth,
      disabled: !entry.selectable,
      expandable: entry.expandable,
      expanded: entry.expanded,
      icon: entry.icon,
      id: entry.id,
      label: entry.label,
      selectable: entry.selectable,
      truncate: filterUi.value.row.truncate,
      value: entry.id,
    })),
  )

  const treeRadioValue = computed({
    get: () => {
      const selected = options.selectedValues.value[0]
      if (isNullish(selected)) {
        return
      }

      return visibleTreeEntries.value.find(
        (entry) => !isNullish(entry.value) && String(entry.value) === String(selected),
      )?.id
    },
    set: (value: string | undefined) => {
      if (isNullish(value)) {
        return
      }

      const match = visibleTreeEntries.value.find((entry) => entry.id === value)
      if (!match || !match.selectable || isNullish(match.value)) {
        return
      }

      options.setSelectedValues([match.value])
    },
  })

  const triggerSummary = computed(() => {
    if (!options.selectedValues.value.length) {
      return ''
    }

    const labels = optionSource.sourceEntries.value
      .filter(
        (entry) =>
          !isNullish(entry.value) &&
          options.selectedValues.value.some((value) => String(value) === String(entry.value)),
      )
      .map((entry) => entry.label)

    if (!labels.length) {
      return `${options.selectedValues.value.length} selected`
    }
    if (labels.length === 1) {
      return labels[0]
    }
    if (labels.length === 2) {
      return labels.join(', ')
    }
    return `${labels[0]}, ${labels[1]} +${labels.length - 2}`
  })

  function toggleValue(value: PrimitiveFilterValue) {
    const exists = options.selectedValues.value.some((entry) => String(entry) === String(value))

    if (filterUi.value.selection.mode === 'single') {
      if (exists) {
        if (!filterUi.value.selection.allowEmpty) {
          return
        }
        options.setSelectedValues([])
        return
      }

      options.setSelectedValues([value])
      return
    }

    if (exists) {
      if (!filterUi.value.selection.allowEmpty && options.selectedValues.value.length === 1) {
        return
      }

      options.setSelectedValues(
        options.selectedValues.value.filter((entry) => String(entry) !== String(value)),
      )
      return
    }

    if (
      !isNullish(filterUi.value.selection.max) &&
      options.selectedValues.value.length >= filterUi.value.selection.max
    ) {
      return
    }

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
      if (entry.expandable) {
        toggleExpanded(entry.id)
      }
      return
    }

    if (isNullish(entry.value)) {
      return
    }
    toggleValue(entry.value)
  }

  function toggleExpanded(id: string) {
    const next = new Set(expandedIds.value)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    expandedIds.value = next
  }

  function toggleBranchSelection(id: string) {
    if (filterUi.value.selection.mode !== 'multiple') {
      return
    }

    const entry = flatTreeEntryMap.value.get(id)
    if (!entry) {
      return
    }

    const descendantValues = collectSelectableDescendantValues({
      entry,
      selectable: filterUi.value.tree.selectable,
    })
    if (!descendantValues.length) {
      if (entry.children.length) {
        toggleExpanded(id)
      }
      return
    }

    const currentKeys = selectedValueKeys.value
    const allSelected = descendantValues.every((value) => currentKeys.has(String(value)))

    if (allSelected) {
      const nextValues = options.selectedValues.value.filter(
        (value) => !descendantValues.some((descendant) => String(descendant) === String(value)),
      )

      if (!filterUi.value.selection.allowEmpty && !nextValues.length) {
        return
      }
      options.setSelectedValues(nextValues)
      return
    }

    const missingValues = descendantValues.filter((value) => !currentKeys.has(String(value)))
    const nextValues = [...options.selectedValues.value, ...missingValues]

    if (
      !isNullish(filterUi.value.selection.max) &&
      nextValues.length > filterUi.value.selection.max
    ) {
      return
    }

    options.setSelectedValues(nextValues)
  }

  function resetExpandedIds() {
    expandedIds.value = new Set()
  }

  return {
    displayEntries,
    filterUi,
    flatRadioItems,
    flatRadioValue,
    optionSource,
    resetExpandedIds,
    toggleExpanded,
    toggleTreeEntry,
    toggleValue,
    treeRadioItems,
    treeRadioValue,
    triggerSummary,
    visibleTreeEntries,
  }
}

function resolveRowIcon(options: {
  entry: { label: string; value?: PrimitiveFilterValue; count?: number; icon?: string }
  filterUi: ReturnType<typeof resolveOptionFilterUi>
}) {
  if (isNullish(options.entry.value)) {
    return options.entry.icon
  }

  const iconOptions: TableFilterOptionEntry = {
    count: options.entry.count,
    label: options.entry.label,
    value: options.entry.value,
  }
  if (options.entry.icon) {
    iconOptions.icon = options.entry.icon
  }
  return options.filterUi.row.getIcon?.(iconOptions) ?? options.entry.icon
}

function mapSelectedTreeEntries(options: {
  entries: TableResolvedFilterOptionEntry[]
  selectedValues: PrimitiveFilterValue[]
  filterUi: ReturnType<typeof resolveOptionFilterUi>
}): TableResolvedFilterOptionEntry[] {
  return options.entries.map((entry) => ({
    ...entry,
    children: mapSelectedTreeEntries({
      entries: entry.children,
      filterUi: options.filterUi,
      selectedValues: options.selectedValues,
    }),
    icon: resolveRowIcon({
      entry,
      filterUi: options.filterUi,
    }),
    selected:
      !isNullish(entry.value) &&
      options.selectedValues.some((value) => String(value) === String(entry.value)),
  }))
}
