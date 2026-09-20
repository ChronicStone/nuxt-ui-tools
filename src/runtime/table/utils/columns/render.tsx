/** @jsxImportSource vue */
/// <reference types="vue/jsx" />

import type { DropdownMenuItem } from '@nuxt/ui/components/DropdownMenu.vue'
import type { VNodeChild } from 'vue'

import {
  isArray,
  isFunction,
  isNumber,
  isObject,
  isString,
  isNullish,
} from '../../../shared/utils/predicate'
import TableRowScopeProvider from '../../components/actions/table-row-scope-provider.vue'
import TableCellEllipsis from '../../components/table/table-cell-ellipsis'
import TableColumnHeader from '../../components/table/table-column-header.vue'
import TableRowActionsControl from '../../components/table/table-row-actions-control.vue'
import TableSelectionControl from '../../components/table/table-selection-control.vue'
import type { GenericObject, TableRuntimeRecord } from '../../types'
import { findSchemaColumn } from './schema'
import {
  ROW_ACTIONS_COLUMN_ID,
  ROW_ACTIONS_COLUMN_WIDTH,
  SELECT_COLUMN_ID,
  SELECT_COLUMN_WIDTH,
} from './types'
import type {
  SchemaTableColumn,
  TableCellRenderContext,
  TableColumnRenderParams,
  TableRuntimeColumn,
  UseTableColumnsParams,
} from './types'

interface PlainRenderContextCacheState {
  contextSource: object
  pageContextSource: object
  plainContext: TableRuntimeRecord
  plainPageContext: TableRuntimeRecord
}

const PLAIN_RENDER_CONTEXT_CACHE = new WeakMap<
  UseTableColumnsParams,
  PlainRenderContextCacheState
>()

export function createSelectionColumn(options: { params: UseTableColumnsParams }) {
  return {
    cell: ({ row }: { row: { id: string } }) => {
      const rowId = String(row.id)
      return (
        <TableSelectionControl
          modelValue={options.params.selection.isRowSelected({ rowId })}
          ariaLabel="Select row"
          onToggle={(event: MouseEvent) =>
            options.params.selection.toggleRowSelection({
              rowId,
              selected: !options.params.selection.isRowSelected({ rowId }),
              shiftKey: event.shiftKey,
            })
          }
        />
      )
    },

    enableHiding: false,

    enablePinning: true,

    enableResizing: false,

    enableSorting: false,

    header: () => (
      <TableSelectionControl
        modelValue={
          options.params.selection.allSelected.value
            ? true
            : options.params.selection.partiallySelected.value
              ? 'indeterminate'
              : false
        }
        ariaLabel="Select all rows"
        onToggle={() =>
          options.params.selection.toggleAllRows({
            selected: !options.params.selection.allSelected.value,
          })
        }
      />
    ),

    id: SELECT_COLUMN_ID,

    meta: {
      class: {
        td: 'w-14 px-4',
        th: 'w-14 px-4',
      },
      style: {
        td: () => ({
          maxWidth: `${SELECT_COLUMN_WIDTH}px`,
          minWidth: `${SELECT_COLUMN_WIDTH}px`,
          width: `${SELECT_COLUMN_WIDTH}px`,
        }),
        th: () => ({
          maxWidth: `${SELECT_COLUMN_WIDTH}px`,
          minWidth: `${SELECT_COLUMN_WIDTH}px`,
          width: `${SELECT_COLUMN_WIDTH}px`,
        }),
      },
    },

    size: SELECT_COLUMN_WIDTH,
  }
}

export function createDataColumns(options: {
  params: UseTableColumnsParams
  visibleOrderedColumns: TableRuntimeColumn[]
  getMenuItems: (options: { columnId: string }) => DropdownMenuItem[][]
  getPinnedState: (options: { columnId: string }) => 'left' | 'right' | null
  getSortState: (options: { columnId: string }) => 'asc' | 'desc' | null
}) {
  return options.visibleOrderedColumns
    .map((runtimeColumn) => {
      if (runtimeColumn.id === ROW_ACTIONS_COLUMN_ID) {
        return createRowActionsColumn({
          params: options.params,
        })
      }

      const column = findSchemaColumn({
        columnId: runtimeColumn.id,
        schema: options.params.schema.value,
      })

      if (!column) {
        return null
      }

      return {
        accessorFn:
          column.kind === 'field'
            ? (row: GenericObject) => getPathValue({ path: column.field, row })
            : undefined,
        cell: ({ row }: { row: { original: GenericObject; index: number } }) =>
          renderColumnCell({
            column,
            params: options.params,
            row: row.original,
            rowIndex: row.index,
          }),
        enableHiding: runtimeColumn.canHide,
        enablePinning: true,
        enableResizing: column.resizable !== false,
        enableSorting: false,
        header: ({
          column: tableColumn,
          header,
        }: {
          column: { getCanHide?: () => boolean; resetSize?: () => void }
          header: { getIsResizing?: () => boolean; getResizeHandler?: () => (event: Event) => void }
        }) => (
          <TableColumnHeader
            label={runtimeColumn.label}
            icon={runtimeColumn.icon}
            sortable={Boolean(runtimeColumn.sortableKey)}
            sortState={options.getSortState({ columnId: runtimeColumn.id })}
            pinned={Boolean(options.getPinnedState({ columnId: runtimeColumn.id }))}
            items={options.getMenuItems({ columnId: runtimeColumn.id })}
            resizable={column.resizable !== false}
            resizing={header.getIsResizing?.() ?? false}
            resetSize={tableColumn.resetSize}
            resize={header.getResizeHandler?.()}
          />
        ),
        id: runtimeColumn.id,
        maxSize: normalizeColumnSize({ size: column.maxWidth }),
        meta: {
          class: {
            td: getColumnCellClass({ column }),
            th: getColumnHeaderClass({ column }),
          },
          style: {
            td: ({ column: cellColumn }: { column: { getSize: () => number } }) => ({
              maxWidth: `${cellColumn.getSize()}px`,
              minWidth: `${cellColumn.getSize()}px`,
              width: `${cellColumn.getSize()}px`,
            }),
            th: ({ column: headerColumn }: { column: { getSize: () => number } }) => ({
              maxWidth: `${headerColumn.getSize()}px`,
              minWidth: `${headerColumn.getSize()}px`,
              width: `${headerColumn.getSize()}px`,
            }),
          },
        },
        minSize: normalizeColumnSize({ size: column.minWidth }) ?? 120,
        size: normalizeColumnSize({ size: column.width }),
      }
    })
    .filter((column): column is Exclude<typeof column, null> => column !== null)
}

export function renderColumnCell(options: TableColumnRenderParams) {
  const cellContext = createCellRenderContext({
    params: options.params,
    row: options.row,
    rowIndex: options.rowIndex,
  })

  if (options.column.kind === 'field') {
    const value = getPathValue({
      path: options.column.field,
      row: options.row,
    })

    if (options.column.render) {
      return wrapRowScope({
        content: wrapEllipsisContent({
          column: options.column,
          // SAFETY: field-column render receives the schema-derived row/value context.
          content: options.column.render({
            ...cellContext,
            // SAFETY: path resolution is checked by the schema field contract at column creation.
            value: value as never,
          } as never),
          title: resolveEllipsisTitle({
            column: options.column,
            fallbackValue: value,
            params: {
              ...cellContext,
              value,
            },
          }),
        }),
        scope: cellContext,
      })
    }

    return wrapRowScope({
      content: wrapEllipsisContent({
        column: options.column,
        content: formatCellValue({ value }),
        title: resolveEllipsisTitle({
          column: options.column,
          fallbackValue: value,
          params: {
            ...cellContext,
            value,
          },
        }),
      }),
      scope: cellContext,
    })
  }

  return wrapRowScope({
    content: wrapEllipsisContent({
      column: options.column,
      // SAFETY: composite/display render receives the schema-derived row context.
      content: options.column.render(cellContext as never),
      title: resolveEllipsisTitle({
        column: options.column,
        fallbackValue: null,
        params: cellContext,
      }),
    }),
    scope: cellContext,
  })
}

export function wrapEllipsisContent(options: {
  column: SchemaTableColumn
  content: VNodeChild
  title?: string | null
}) {
  const baseClass = 'min-w-0 max-w-full overflow-hidden'

  if (!options.column.ellipsis) {
    return <div class={baseClass}>{options.content}</div>
  }

  return (
    <TableCellEllipsis title={options.title ?? undefined} wrapperClass={baseClass}>
      {options.content}
    </TableCellEllipsis>
  )
}

export function getColumnHeaderClass(options: { column: SchemaTableColumn }) {
  return [
    'bg-default',
    options.column.labelAlign === 'right' ? 'text-right' : '',
    options.column.labelAlign === 'center' ? 'text-center' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

export function getColumnCellClass(options: { column: SchemaTableColumn }) {
  return [
    'overflow-hidden',
    options.column.align === 'right' ? 'text-right' : '',
    options.column.align === 'center' ? 'text-center' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

export function normalizeColumnSize(options: { size?: number | string }) {
  if (isNumber(options.size)) {
    return options.size
  }

  if (isString(options.size)) {
    const parsed = Number.parseFloat(options.size)
    return Number.isFinite(parsed) ? parsed : undefined
  }
}

function createCellRenderContext(options: {
  row: GenericObject
  rowIndex: number
  params: UseTableColumnsParams
}): TableCellRenderContext {
  const tableApi = options.params.tableApi.value
  if (!tableApi) {
    throw new Error('Table API is not ready')
  }
  const plainRenderContext = resolvePlainRenderContext(options.params)

  return {
    context: plainRenderContext.plainContext,
    index: options.rowIndex,
    layout: options.params.tableLayout.value,
    pageContext: plainRenderContext.plainPageContext,
    row: options.row,
    tableApi,
  }
}

export function createRowActionsColumn(options: { params: UseTableColumnsParams }) {
  return {
    cell: ({ row }: { row: { original: GenericObject; index: number } }) => {
      const scope = createCellRenderContext({
        params: options.params,
        row: row.original,
        rowIndex: row.index,
      })

      return (
        <TableRowScopeProvider scope={scope}>
          <TableRowActionsControl />
        </TableRowScopeProvider>
      )
    },
    enableHiding: false,
    enablePinning: true,
    enableResizing: false,
    enableSorting: false,
    header: () => null,
    id: ROW_ACTIONS_COLUMN_ID,
    meta: {
      class: {
        td: 'w-13 px-2',
        th: 'w-13 px-2',
      },
      style: {
        td: () => ({
          maxWidth: `${ROW_ACTIONS_COLUMN_WIDTH}px`,
          minWidth: `${ROW_ACTIONS_COLUMN_WIDTH}px`,
          width: `${ROW_ACTIONS_COLUMN_WIDTH}px`,
        }),
        th: () => ({
          maxWidth: `${ROW_ACTIONS_COLUMN_WIDTH}px`,
          minWidth: `${ROW_ACTIONS_COLUMN_WIDTH}px`,
          width: `${ROW_ACTIONS_COLUMN_WIDTH}px`,
        }),
      },
    },
    size: ROW_ACTIONS_COLUMN_WIDTH,
  }
}

function wrapRowScope(options: { scope: TableCellRenderContext; content: VNodeChild }) {
  return <TableRowScopeProvider scope={options.scope}>{options.content}</TableRowScopeProvider>
}

function resolvePlainRenderContext(params: UseTableColumnsParams): PlainRenderContextCacheState {
  const contextSource = params.data.contextData.value
  const pageContextSource = params.data.pageContextData.value
  const cached = PLAIN_RENDER_CONTEXT_CACHE.get(params)

  if (
    cached &&
    cached.contextSource === contextSource &&
    cached.pageContextSource === pageContextSource
  ) {
    return cached
  }

  const nextCache: PlainRenderContextCacheState = {
    contextSource,
    pageContextSource,
    plainContext: toPlainRecord(contextSource),
    plainPageContext: toPlainRecord(pageContextSource),
  }

  PLAIN_RENDER_CONTEXT_CACHE.set(params, nextCache)
  return nextCache
}

function toPlainRecord(value: GenericObject): TableRuntimeRecord {
  return Object.fromEntries(Object.entries(value))
}

function resolveEllipsisTitle(options: {
  column: SchemaTableColumn
  params: unknown
  fallbackValue: unknown
}) {
  if (!options.column.ellipsis) {
    return null
  }

  if (isObject(options.column.ellipsis)) {
    const title = 'title' in options.column.ellipsis ? options.column.ellipsis.title : undefined

    if (isEllipsisTitleResolver(title)) {
      return String(title(options.params))
    }

    if (!isNullish(title)) {
      return String(title)
    }
  }

  return isNullish(options.fallbackValue) ? null : String(options.fallbackValue)
}

function isEllipsisTitleResolver<TValue>(
  value: TValue,
): value is TValue & ((params: TValue) => VNodeChild) {
  return isFunction(value)
}

function formatCellValue(options: { value: unknown }) {
  if (isNullish(options.value)) {
    return '—'
  }

  if (options.value instanceof Date) {
    return options.value.toLocaleString()
  }

  if (isArray(options.value)) {
    return options.value.join(', ')
  }

  if (isObject(options.value)) {
    return JSON.stringify(options.value)
  }

  return String(options.value)
}

function getPathValue(options: { row: GenericObject; path: string }) {
  return options.path.split('.').reduce<unknown>((value, key) => {
    if (!isObject(value)) {
      return
    }

    return value[key]
  }, options.row)
}
