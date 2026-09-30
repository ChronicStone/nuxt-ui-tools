import { computed, shallowRef, watch } from 'vue'

import type {
  SpreadsheetIssueLevel,
  SpreadsheetIssueType,
  SpreadsheetRecord,
  SpreadsheetReviewLevel,
  SpreadsheetReviewMode,
  SpreadsheetReviewTab,
  SpreadsheetRow,
} from '../types'
import type { useSpreadsheetLayout } from './use-spreadsheet-layout'
import type { useSpreadsheetRows } from './use-spreadsheet-rows'

export interface UseSpreadsheetReviewParams {
  rows: ReturnType<typeof useSpreadsheetRows>
  layout: ReturnType<typeof useSpreadsheetLayout>
}

const LEVEL_RANK: Record<SpreadsheetIssueLevel, number> = { error: 3, info: 1, warning: 2 }

/**
 * What the review shows: tab, filters, search, selection, and the inspected row. Shared by the
 * table, its toolbar, and the row inspector wherever they are placed.
 */
export function useSpreadsheetReview(params: UseSpreadsheetReviewParams) {
  const tab = shallowRef<SpreadsheetReviewTab>('all')
  const level = shallowRef<SpreadsheetReviewLevel>('all')
  const mode = shallowRef<SpreadsheetReviewMode>('all')
  const issue = shallowRef<string>('')
  const search = shallowRef<string>('')
  const selection = shallowRef<ReadonlySet<number>>(new Set())
  const inspectedIndex = shallowRef<number | null>(null)

  watch([params.layout.sheet, () => params.layout.selection.value.headerRow], () => reset())

  const all = computed(() => params.rows.rows.value)

  const issueTypes = computed(() => {
    const types = new Map<string, SpreadsheetIssueType>()
    for (const row of all.value) {
      if (row.discardReason) continue
      const seen = new Set<string>()
      for (const entry of row.issues) {
        if (!entry.field || entry.level === 'info') continue
        const id = `${entry.field}|${entry.code}`
        if (seen.has(id)) continue
        seen.add(id)
        const type = types.get(id)
        if (type) type.rowCount += 1
        else
          types.set(id, {
            code: entry.code,
            field: entry.field,
            id,
            level: entry.level,
            message: entry.message,
            rowCount: 1,
          })
      }
    }
    return [...types.values()].sort((left, right) => right.rowCount - left.rowCount)
  })

  const fieldIssues = computed(() => {
    const counts = new Map<string, { rowCount: number; level: SpreadsheetIssueLevel }>()
    for (const row of all.value) {
      if (row.discardReason) continue
      for (const [field, entry] of Object.entries(row.fieldIssues)) {
        if (entry.level === 'info') continue
        const count = counts.get(field)
        if (!count) counts.set(field, { level: entry.level, rowCount: 1 })
        else {
          count.rowCount += 1
          if (LEVEL_RANK[entry.level] > LEVEL_RANK[count.level]) count.level = entry.level
        }
      }
    }
    return counts
  })

  const visible = computed(() => {
    let list: readonly SpreadsheetRow<SpreadsheetRecord, unknown>[] =
      tab.value === 'importable'
        ? params.rows.importable.value
        : tab.value === 'invalid'
          ? params.rows.invalid.value
          : tab.value === 'discarded'
            ? params.rows.discarded.value
            : all.value
    if (tab.value !== 'discarded') {
      if (level.value === 'blocking')
        list = list.filter((row) => !row.discardReason && row.errors.length)
      if (level.value === 'warnings')
        list = list.filter((row) => !row.discardReason && row.warnings.length)
      if (mode.value !== 'all') list = list.filter((row) => row.mode === mode.value)
    }
    if (issue.value) {
      const [field, code] = issue.value.split('|')
      list = list.filter((row) =>
        row.issues.some((entry) => entry.field === field && (code === '*' || entry.code === code)),
      )
    }
    const query = search.value.trim().toLowerCase()
    if (query) {
      const parsed = params.rows.parsed.value
      list = list.filter((row) =>
        [...(parsed[row.index]?.cells.values() ?? [])].some(
          (cell) =>
            cell.text.toLowerCase().includes(query) || cell.display.toLowerCase().includes(query),
        ),
      )
    }
    return list
  })

  const withIssues = computed(() =>
    all.value.filter((row) => !row.discardReason && (row.errors.length || row.warnings.length)),
  )
  const inspected = computed(() =>
    inspectedIndex.value === null ? null : (all.value[inspectedIndex.value] ?? null),
  )
  const position = computed(() => ({
    current:
      inspectedIndex.value === null
        ? 0
        : withIssues.value.findIndex((row) => row.index === inspectedIndex.value) + 1,
    total: withIssues.value.length,
  }))

  function setTab(value: SpreadsheetReviewTab) {
    tab.value = value
    selection.value = new Set()
    if (value === 'importable' || value === 'discarded') level.value = 'all'
  }

  function setLevel(value: SpreadsheetReviewLevel) {
    level.value = value
    if (value !== 'all' && (tab.value === 'importable' || tab.value === 'discarded'))
      tab.value = 'all'
  }

  function setMode(value: SpreadsheetReviewMode) {
    mode.value = value
  }

  function setIssue(value: string) {
    issue.value = value
    if (value && (tab.value === 'importable' || tab.value === 'discarded')) tab.value = 'all'
  }

  function setSearch(value: string) {
    search.value = value
  }

  function select(indexes: readonly number[], selected: boolean) {
    const next = new Set(selection.value)
    for (const index of indexes) {
      if (selected) next.add(index)
      else next.delete(index)
    }
    selection.value = next
  }

  function clearSelection() {
    selection.value = new Set()
  }

  function inspect(index: number | null) {
    inspectedIndex.value = index
  }

  function step(direction: 1 | -1) {
    const current = withIssues.value.findIndex((row) => row.index === inspectedIndex.value)
    const next = withIssues.value[current < 0 ? 0 : current + direction]
    if (next) inspectedIndex.value = next.index
  }

  function reset() {
    tab.value = 'all'
    level.value = 'all'
    mode.value = 'all'
    issue.value = ''
    search.value = ''
    selection.value = new Set()
    inspectedIndex.value = null
  }

  return {
    clearSelection,
    fieldIssues,
    inspect,
    inspected,
    issue,
    issueTypes,
    level,
    mode,
    next: () => step(1),
    position,
    previous: () => step(-1),
    reset,
    search,
    select,
    selection,
    setIssue,
    setLevel,
    setMode,
    setSearch,
    setTab,
    tab,
    visible,
  }
}
