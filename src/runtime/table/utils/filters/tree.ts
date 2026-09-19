import type { TableResolvedFilterOptionEntry, TableVisibleFilterOptionEntry } from '../../types'

export function flattenFilterOptionEntries(
  entries: TableResolvedFilterOptionEntry[],
): TableResolvedFilterOptionEntry[] {
  return entries.flatMap((entry) => [entry, ...flattenFilterOptionEntries(entry.children)])
}

export function collectFilterOptionBranchIds(entries: TableResolvedFilterOptionEntry[]): string[] {
  return entries.flatMap((entry) =>
    entry.children.length ? [entry.id, ...collectFilterOptionBranchIds(entry.children)] : [],
  )
}

export function filterFilterOptionTree(options: {
  entries: TableResolvedFilterOptionEntry[]
  search: string
}) {
  const normalizedSearch = options.search.trim().toLowerCase()

  if (!normalizedSearch.length) {
    const expandedIds: string[] = []
    return {
      entries: options.entries,
      expandedIds,
    }
  }

  const expandedIds = new Set<string>()
  const entries = filterEntries({
    entries: options.entries,
    expandedIds,
    normalizedSearch,
  })

  return {
    entries,
    expandedIds: [...expandedIds],
  }
}

export function flattenVisibleFilterOptionTree(options: {
  entries: TableResolvedFilterOptionEntry[]
  expandedIds: Set<string>
  selectable: 'all' | 'leaf-only'
  branchSelection?: 'off' | 'children'
}): TableVisibleFilterOptionEntry[] {
  return flattenVisibleEntries({
    branchSelection: options.branchSelection ?? 'children',
    depth: 0,
    entries: options.entries,
    expandedIds: options.expandedIds,
    selectable: options.selectable,
  })
}

export function collectSelectableDescendantValues(options: {
  entry: TableResolvedFilterOptionEntry
  selectable: 'all' | 'leaf-only'
}): (string | number | boolean)[] {
  return options.entry.children.flatMap((child) =>
    collectSelectableValues({
      entry: child,
      selectable: options.selectable,
    }),
  )
}

export function collectSelectedBranchIds(entries: TableResolvedFilterOptionEntry[]): string[] {
  const ids = new Set<string>()

  entries.forEach((entry) => {
    collectSelectedBranchIdsRecursive(entry, ids)
  })

  return [...ids]
}

function filterEntries(options: {
  entries: TableResolvedFilterOptionEntry[]
  normalizedSearch: string
  expandedIds: Set<string>
}): TableResolvedFilterOptionEntry[] {
  return options.entries.flatMap((entry) => {
    const children = filterEntries({
      entries: entry.children,
      expandedIds: options.expandedIds,
      normalizedSearch: options.normalizedSearch,
    })
    const matchesSelf = entry.label.toLowerCase().includes(options.normalizedSearch)
    const hasMatchingChildren = children.length > 0

    if (!matchesSelf && !hasMatchingChildren) {
      return []
    }
    if (entry.children.length) {
      options.expandedIds.add(entry.id)
    }

    return [
      {
        ...entry,
        children: matchesSelf ? entry.children : children,
      },
    ]
  })
}

function flattenVisibleEntries(options: {
  entries: TableResolvedFilterOptionEntry[]
  expandedIds: Set<string>
  selectable: 'all' | 'leaf-only'
  branchSelection: 'off' | 'children'
  depth: number
}): TableVisibleFilterOptionEntry[] {
  return options.entries.flatMap((entry) => {
    const expandable = entry.children.length > 0
    const selectable = entry.value != null && (options.selectable === 'all' || !expandable)
    const branchSelectable =
      entry.value == null && expandable && options.branchSelection === 'children'
    const current: TableVisibleFilterOptionEntry = {
      branchSelectable,
      color: entry.color,
      count: entry.count,
      depth: options.depth,
      expandable,
      icon: entry.icon,
      id: entry.id,
      label: entry.label,
      selectable,
      selected: entry.selected,
      value: entry.value,
    }

    if (!expandable || !options.expandedIds.has(entry.id)) {
      return [current]
    }

    return [
      current,
      ...flattenVisibleEntries({
        branchSelection: options.branchSelection,
        depth: options.depth + 1,
        entries: entry.children,
        expandedIds: options.expandedIds,
        selectable: options.selectable,
      }),
    ]
  })
}

function collectSelectableValues(options: {
  entry: TableResolvedFilterOptionEntry
  selectable: 'all' | 'leaf-only'
}): (string | number | boolean)[] {
  const expandable = options.entry.children.length > 0
  const ownValue =
    options.entry.value != null && (options.selectable === 'all' || !expandable)
      ? [options.entry.value]
      : []

  return [
    ...ownValue,
    ...options.entry.children.flatMap((child) =>
      collectSelectableValues({
        entry: child,
        selectable: options.selectable,
      }),
    ),
  ]
}

function collectSelectedBranchIdsRecursive(
  entry: TableResolvedFilterOptionEntry,
  ids: Set<string>,
): boolean {
  const hasSelectedChild = entry.children.some((child) =>
    collectSelectedBranchIdsRecursive(child, ids),
  )
  const hasSelection = entry.selected || hasSelectedChild

  if (entry.children.length && hasSelection) {
    ids.add(entry.id)
  }

  return hasSelection
}
