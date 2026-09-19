import { computed, ref, shallowRef, watch, type ComputedRef, type Ref } from 'vue'

import { isDate, isFunction, isObject } from '../../shared/utils/predicate'
import type {
  GenericObject,
  TableColumnSummary,
  TableColumnSummaryConfig,
  TableSchemaView,
  TableSummaryContext,
  TableSummaryKind,
  TableSummaryScope,
  TableSummaryValue,
} from '../types'
import type { TableRuntimeColumn } from '../utils/columns/types'
import type { useTableData } from './use-table-data'
import type { useTableSelection } from './use-table-selection'

export interface UseTableSummariesParams {
  schema: ComputedRef<TableSchemaView>
  queryContent: ReturnType<typeof useTableData>
  selection: ReturnType<typeof useTableSelection>
  runtimeColumns: ComputedRef<TableRuntimeColumn[]>
}

export interface TableSummaryCell {
  value: TableSummaryValue
  loading: boolean
  error: Error | null
}

export function useTableSummaries(params: UseTableSummariesParams) {
  const config = computed(() => params.schema.value.table?.summaries)
  const columns = computed(() => params.runtimeColumns.value.filter((column) => column.summary))
  const enabled = computed(() => columns.value.length > 0 || Boolean(config.value?.resolve))
  const scopes = computed<TableSummaryScope[]>(
    () =>
      config.value?.scopes ??
      (params.selection.selectionEnabled.value
        ? ['filtered', 'page', 'selection']
        : ['filtered', 'page']),
  )
  const scope: Ref<TableSummaryScope> = ref(config.value?.scope ?? 'filtered')
  const rows = computed<GenericObject[]>(() => {
    if (scope.value === 'selection') return params.selection.selectedRows.value
    if (scope.value === 'page') return params.queryContent.data.value.rows
    return params.queryContent.selectableRows.value
  })
  const count = computed(() =>
    scope.value === 'filtered' && params.schema.value.source.mode !== 'client'
      ? (params.queryContent.data.value.rowCount ?? rows.value.length)
      : rows.value.length,
  )
  const cells = shallowRef<Record<string, TableSummaryCell>>({})
  const loading = computed(() => Object.values(cells.value).some((cell) => cell.loading))
  let token = 0

  function setScope(next: TableSummaryScope) {
    scope.value = next
  }

  function cell(columnId: string): TableSummaryCell {
    return cells.value[columnId] ?? { value: undefined, loading: false, error: null }
  }

  function format(columnId: string) {
    const column = columns.value.find((entry) => entry.id === columnId)
    const summary = column?.summary
    const current = cell(columnId)
    const context = createContext(columnId)
    const formatter = isConfig(summary) ? summary.format : undefined
    if (formatter && !current.loading) return formatter(current.value, context)
    return current.value
  }

  function createContext(columnId: string): TableSummaryContext {
    return {
      rows: rows.value,
      scope: scope.value,
      columnKey: columnId,
      request: params.queryContent.requestContext.value,
    }
  }

  async function compute() {
    const run = ++token
    if (!enabled.value) {
      cells.value = {}
      return
    }
    const next: Record<string, TableSummaryCell> = {}
    const pending: Array<Promise<void>> = []
    const remoteFiltered =
      scope.value === 'filtered' && params.schema.value.source.mode !== 'client'

    for (const column of columns.value) {
      const summary = column.summary
      if (!summary) continue
      const context = createContext(column.id)
      const resolver = isResolver(summary) ? summary : isConfig(summary) ? summary.resolve : undefined
      const kind = isResolver(summary) ? undefined : isConfig(summary) ? summary.kind : summary

      if (resolver) {
        next[column.id] = { value: cells.value[column.id]?.value, loading: true, error: null }
        pending.push(
          Promise.resolve()
            .then(() => resolver(context))
            .then((value) => {
              if (run !== token) return
              cells.value = { ...cells.value, [column.id]: { value, loading: false, error: null } }
            })
            .catch((cause: unknown) => {
              if (run !== token) return
              cells.value = {
                ...cells.value,
                [column.id]: { value: undefined, loading: false, error: toError(cause) },
              }
            }),
        )
        continue
      }

      if (kind && !remoteFiltered) {
        next[column.id] = { value: derive(kind, rows.value, column.id), loading: false, error: null }
        continue
      }

      next[column.id] = { value: cells.value[column.id]?.value, loading: true, error: null }
    }

    cells.value = next

    const resolveAll = config.value?.resolve
    if (resolveAll) {
      pending.push(
        Promise.resolve()
          .then(() =>
            resolveAll({
              scope: scope.value,
              rows: rows.value,
              request: params.queryContent.requestContext.value,
            }),
          )
          .then((values) => {
            if (run !== token) return
            const merged = { ...cells.value }
            for (const [key, value] of Object.entries(values ?? {}))
              merged[key] = { value, loading: false, error: null }
            for (const column of columns.value)
              if (merged[column.id]?.loading) merged[column.id] = { ...merged[column.id]!, loading: false }
            cells.value = merged
          })
          .catch((cause: unknown) => {
            if (run !== token) return
            const merged = { ...cells.value }
            for (const column of columns.value)
              if (merged[column.id]?.loading) merged[column.id] = { value: undefined, loading: false, error: toError(cause) }
            cells.value = merged
          }),
      )
    } else if (remoteFiltered) {
      const merged = { ...cells.value }
      for (const column of columns.value)
        if (merged[column.id]?.loading && !isResolver(column.summary) && !(isConfig(column.summary) && column.summary.resolve))
          merged[column.id] = { value: undefined, loading: false, error: null }
      cells.value = merged
    }

    await Promise.all(pending)
  }

  watch(
    [rows, scope, columns, () => params.queryContent.status.value.isFetching],
    ([, , , fetching]) => {
      if (fetching) return
      void compute()
    },
    { immediate: true, flush: 'post' },
  )

  return {
    enabled,
    scope,
    scopes,
    setScope,
    rows,
    count,
    cells,
    cell,
    format,
    loading,
    label: computed(() => config.value?.label),
    columns,
  }
}

type TableSummaryResolver = (context: TableSummaryContext) => TableSummaryValue | Promise<TableSummaryValue>

function isConfig(value: TableColumnSummary | undefined): value is TableColumnSummaryConfig {
  return isObject(value)
}

function isResolver(value: TableColumnSummary | undefined): value is TableSummaryResolver {
  return isFunction(value)
}

function toError(cause: unknown): Error {
  return cause instanceof Error ? cause : new Error(String(cause))
}

function readPath(row: GenericObject, path: string): TableSummaryValue {
  let current: GenericObject | TableSummaryValue = row
  for (const key of path.split('.')) {
    if (!isObject(current) || isDate(current)) return undefined
    const next: unknown = current[key]
    if (isObject(next) || isDate(next) || isPrimitiveSummary(next)) current = next
    else return undefined
  }
  if (isDate(current) || isPrimitiveSummary(current)) return current
  return undefined
}

function isPrimitiveSummary(value: unknown): value is TableSummaryValue {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
}

function derive(kind: TableSummaryKind, rows: GenericObject[], key: string): number | null {
  if (kind === 'count') return rows.length
  const numbers = rows
    .map((row) => readPath(row, key))
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  if (!numbers.length) return kind === 'sum' ? 0 : null
  if (kind === 'sum') return numbers.reduce((total, value) => total + value, 0)
  if (kind === 'avg') return numbers.reduce((total, value) => total + value, 0) / numbers.length
  if (kind === 'min') return Math.min(...numbers)
  if (kind === 'max') return Math.max(...numbers)
  return null
}
