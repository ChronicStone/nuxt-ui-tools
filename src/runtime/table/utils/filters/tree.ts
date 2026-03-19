import type {
  TableResolvedFilterOptionEntry,
  TableVisibleFilterOptionEntry,
} from '../../types'

export function flattenFilterOptionEntries(
  entries: TableResolvedFilterOptionEntry[],
): TableResolvedFilterOptionEntry[] {
  return entries.flatMap(entry => [entry, ...flattenFilterOptionEntries(entry.children)])
}

export function collectFilterOptionBranchIds(entries: TableResolvedFilterOptionEntry[]): string[] {
  return entries.flatMap((entry) =>
    entry.children.length
      ? [entry.id, ...collectFilterOptionBranchIds(entry.children)]
      : [],
  )
}

export function filterFilterOptionTree(options: {
  entries: TableResolvedFilterOptionEntry[]
  search: string
}) {
  const normalizedSearch = options.search.trim().toLowerCase()

  if (!normalizedSearch.length) {
    return {
      entries: options.entries,
      expandedIds: [] as string[],
    }
  }

  const expandedIds = new Set<string>()
  const entries = filterEntries({
    entries: options.entries,
    normalizedSearch,
    expandedIds,
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
}): TableVisibleFilterOptionEntry[] {
  return flattenVisibleEntries({
    entries: options.entries,
    expandedIds: options.expandedIds,
    selectable: options.selectable,
    depth: 0,
  })
}

function filterEntries(options: {
  entries: TableResolvedFilterOptionEntry[]
  normalizedSearch: string
  expandedIds: Set<string>
}): TableResolvedFilterOptionEntry[] {
  return options.entries.flatMap((entry) => {
    const children = filterEntries({
      entries: entry.children,
      normalizedSearch: options.normalizedSearch,
      expandedIds: options.expandedIds,
    })
    const matchesSelf = entry.label.toLowerCase().includes(options.normalizedSearch)
    const hasMatchingChildren = children.length > 0

    if (!matchesSelf && !hasMatchingChildren) return []
    if (entry.children.length) options.expandedIds.add(entry.id)

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
  depth: number
}): TableVisibleFilterOptionEntry[] {
  return options.entries.flatMap((entry) => {
    const expandable = entry.children.length > 0
    const selectable =
      entry.value != null &&
      (options.selectable === 'all' || !expandable)
    const current: TableVisibleFilterOptionEntry = {
      id: entry.id,
      label: entry.label,
      value: entry.value,
      icon: entry.icon,
      count: entry.count,
      selected: entry.selected,
      depth: options.depth,
      expandable,
      selectable,
    }

    if (!expandable || !options.expandedIds.has(entry.id)) return [current]

    return [
      current,
      ...flattenVisibleEntries({
        entries: entry.children,
        expandedIds: options.expandedIds,
        selectable: options.selectable,
        depth: options.depth + 1,
      }),
    ]
  })
}
