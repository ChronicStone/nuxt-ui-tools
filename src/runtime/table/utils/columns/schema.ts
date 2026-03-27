import type { GenericObject, TableSchemaView } from '../../types'
import { resolveTextValue } from '#ui-tools/shared/utils/render'
import type { SchemaTableColumn, TableRuntimeColumn } from './types'

export function findSchemaColumn(options: {
  schema: TableSchemaView
  columnId: string
}): SchemaTableColumn | undefined {
  return (options.schema.table?.columns ?? []).find((column) => column.key === options.columnId)
}

export function createRuntimeColumns(options: {
  schema: TableSchemaView
  context: GenericObject
}) {
  return (options.schema.table?.columns ?? [])
    .filter((column) => (column.condition?.() ?? true) && (column.enabled ?? true))
    .map(
      (column): TableRuntimeColumn => ({
        id: column.key,
        label: resolveColumnLabel({ column }),
        icon: column.icon,
        sortableKey: getSortableKey({ column }),
        canHide: !column.required,
        defaultVisible: resolveColumnVisibility({
          column,
          context: options.context,
        }),
        configurable: true,
        pinned: column.pinned,
      }),
    )
}

export function createOrderedColumns(options: {
  runtimeColumns: TableRuntimeColumn[]
  columnOrder: string[]
}) {
  const lookup = new Map(options.runtimeColumns.map((column) => [column.id, column]))
  const orderedIds = [...options.columnOrder, ...options.runtimeColumns.map((column) => column.id)]

  return uniqueColumnIds({ columnIds: orderedIds })
    .map((id) => lookup.get(id))
    .filter((column): column is TableRuntimeColumn => Boolean(column))
}

export function createVisibleOrderedColumns(options: {
  orderedColumns: TableRuntimeColumn[]
  columnVisibility: Record<string, boolean>
}) {
  return options.orderedColumns.filter((column) => options.columnVisibility?.[column.id] !== false)
}

export function resolveColumnLabel(options: { column: SchemaTableColumn }) {
  if (typeof options.column.label === 'function') {
    const resolved = options.column.label()
    return typeof resolved === 'string' || typeof resolved === 'number'
      ? String(resolved)
      : humanizeKey({ value: options.column.key })
  }

  return resolveTextValue(options.column.label, humanizeKey({ value: options.column.key }))
}

export function resolveColumnVisibility(options: {
  column: SchemaTableColumn
  context: GenericObject
}) {
  if (typeof options.column.visible === 'function') {
    return options.column.visible(options.context as never)
  }

  return options.column.visible ?? true
}

export function getSortableKey(options: { column: SchemaTableColumn }) {
  if (options.column.kind === 'field' && options.column.sortable !== false) {
    return options.column.field
  }

  if (options.column.kind === 'composite') {
    return options.column.sortableKey
  }

  return undefined
}

export function uniqueColumnIds(options: { columnIds: string[] }) {
  return Array.from(new Set(options.columnIds))
}

function humanizeKey(options: { value: string }) {
  return options.value
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase())
}
