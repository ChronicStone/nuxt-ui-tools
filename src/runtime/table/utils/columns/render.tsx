/** @jsxImportSource vue */
/// <reference types="vue/jsx" />

import type { DropdownMenuItem } from '@nuxt/ui/components/DropdownMenu.vue'
import type { VNodeChild } from 'vue'

import { isArray, isFunction, isNumber, isObject, isString } from '../../../shared/utils/predicate'
import TableRowScopeProvider from '../../components/actions/TableRowScopeProvider.vue'
import TableCellEllipsis from '../../components/table/TableCellEllipsis'
import TableColumnHeader from '../../components/table/TableColumnHeader.vue'
import TableRowActionsControl from '../../components/table/TableRowActionsControl.vue'
import TableSelectionControl from '../../components/table/TableSelectionControl.vue'
import type { GenericObject, TableRuntimeRecord } from '../../types'
import { getColumnHeaderIcon } from './menu'
import { findSchemaColumn } from './schema'
import {
  ROW_ACTIONS_COLUMN_ID,
  ROW_ACTIONS_COLUMN_WIDTH,
  SELECT_COLUMN_ID,
  SELECT_COLUMN_WIDTH,
  type SchemaTableColumn,
  type TableCellRenderContext,
  type TableColumnRenderParams,
  type TableRuntimeColumn,
  type UseTableColumnsParams,
} from './types'

type PlainRenderContextCacheState = {
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
    id: SELECT_COLUMN_ID,

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
    size: SELECT_COLUMN_WIDTH,
    enableSorting: false,
    enableHiding: false,
    enablePinning: true,
    enableResizing: false,
    meta: {
      class: {
        th: 'w-14 px-4',
        td: 'w-14 px-4',
      },
      style: {
        th: () => ({
          width: `${SELECT_COLUMN_WIDTH}px`,
          minWidth: `${SELECT_COLUMN_WIDTH}px`,
          maxWidth: `${SELECT_COLUMN_WIDTH}px`,
        }),
        td: () => ({
          width: `${SELECT_COLUMN_WIDTH}px`,
          minWidth: `${SELECT_COLUMN_WIDTH}px`,
          maxWidth: `${SELECT_COLUMN_WIDTH}px`,
        }),
      },
    },
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
        schema: options.params.schema.value,
        columnId: runtimeColumn.id,
      })

      if (!column) {
        return null
      }

      return {
        id: runtimeColumn.id,
        accessorFn:
          column.kind === 'field'
            ? (row: GenericObject) => getPathValue({ row, path: column.field })
            : undefined,
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
            headerIcon={getColumnHeaderIcon({
              columnId: runtimeColumn.id,
              canHide: tableColumn.getCanHide?.(),
              getSortState: options.getSortState,
              getPinnedState: options.getPinnedState,
            })}
            pinned={Boolean(options.getPinnedState({ columnId: runtimeColumn.id }))}
            items={options.getMenuItems({ columnId: runtimeColumn.id })}
            resizable={column.resizable !== false}
            resizing={header.getIsResizing?.() ?? false}
            resetSize={tableColumn.resetSize}
            resize={header.getResizeHandler?.()}
          />
        ),
        cell: ({ row }: { row: { original: GenericObject; index: number } }) =>
          renderColumnCell({
            column,
            row: row.original,
            rowIndex: row.index,
            params: options.params,
          }),
        enableSorting: false,
        enableHiding: runtimeColumn.canHide,
        enablePinning: true,
        enableResizing: column.resizable !== false,
        size: normalizeColumnSize({ size: column.width }),
        minSize: normalizeColumnSize({ size: column.minWidth }) ?? 120,
        maxSize: normalizeColumnSize({ size: column.maxWidth }),
        meta: {
          class: {
            th: getColumnHeaderClass({ column }),
            td: getColumnCellClass({ column }),
          },
          style: {
            th: ({ column: headerColumn }: { column: { getSize: () => number } }) => ({
              width: `${headerColumn.getSize()}px`,
              minWidth: `${headerColumn.getSize()}px`,
              maxWidth: `${headerColumn.getSize()}px`,
            }),
            td: ({ column: cellColumn }: { column: { getSize: () => number } }) => ({
              width: `${cellColumn.getSize()}px`,
              minWidth: `${cellColumn.getSize()}px`,
              maxWidth: `${cellColumn.getSize()}px`,
            }),
          },
        },
      }
    })
    .filter((column): column is Exclude<typeof column, null> => column !== null)
}

export function renderColumnCell(options: TableColumnRenderParams) {
  const cellContext = createCellRenderContext({
    row: options.row,
    rowIndex: options.rowIndex,
    params: options.params,
  })

  if (options.column.kind === 'field') {
    const value = getPathValue({
      row: options.row,
      path: options.column.field,
    })

    if (options.column.render) {
      return wrapRowScope({
        scope: cellContext,
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
            params: {
              ...cellContext,
              value,
            },
            fallbackValue: value,
          }),
        }),
      })
    }

    return wrapRowScope({
      scope: cellContext,
      content: wrapEllipsisContent({
        column: options.column,
        content: formatCellValue({ value }),
        title: resolveEllipsisTitle({
          column: options.column,
          params: {
            ...cellContext,
            value,
          },
          fallbackValue: value,
        }),
      }),
    })
  }

  return wrapRowScope({
    scope: cellContext,
    content: wrapEllipsisContent({
      column: options.column,
      // SAFETY: composite/display render receives the schema-derived row context.
      content: options.column.render(cellContext as never),
      title: resolveEllipsisTitle({
        column: options.column,
        params: cellContext,
        fallbackValue: null,
      }),
    }),
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

  return undefined
}

function createCellRenderContext(options: {
  row: GenericObject
  rowIndex: number
  params: UseTableColumnsParams
}): TableCellRenderContext {
  const tableApi = options.params.tableApi.value
  if (!tableApi) throw new Error('Table API is not ready')
  const plainRenderContext = resolvePlainRenderContext(options.params)

  return {
    row: options.row,
    index: options.rowIndex,
    context: plainRenderContext.plainContext,
    pageContext: plainRenderContext.plainPageContext,
    tableApi,
    layout: options.params.tableLayout.value,
  }
}

function createRowActionsColumn(options: { params: UseTableColumnsParams }) {
  return {
    id: ROW_ACTIONS_COLUMN_ID,
    header: () => null,
    cell: ({ row }: { row: { original: GenericObject; index: number } }) => {
      const scope = createCellRenderContext({
        row: row.original,
        rowIndex: row.index,
        params: options.params,
      })

      return (
        <TableRowScopeProvider scope={scope}>
          <TableRowActionsControl />
        </TableRowScopeProvider>
      )
    },
    size: ROW_ACTIONS_COLUMN_WIDTH,
    enableSorting: false,
    enableHiding: false,
    enablePinning: true,
    enableResizing: false,
    meta: {
      class: {
        th: 'w-13 px-2',
        td: 'w-13 px-2',
      },
      style: {
        th: () => ({
          width: `${ROW_ACTIONS_COLUMN_WIDTH}px`,
          minWidth: `${ROW_ACTIONS_COLUMN_WIDTH}px`,
          maxWidth: `${ROW_ACTIONS_COLUMN_WIDTH}px`,
        }),
        td: () => ({
          width: `${ROW_ACTIONS_COLUMN_WIDTH}px`,
          minWidth: `${ROW_ACTIONS_COLUMN_WIDTH}px`,
          maxWidth: `${ROW_ACTIONS_COLUMN_WIDTH}px`,
        }),
      },
    },
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
  )
    return cached

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

    if (title != null) {
      return String(title)
    }
  }

  return options.fallbackValue == null ? null : String(options.fallbackValue)
}

function isEllipsisTitleResolver<TValue>(
  value: TValue,
): value is TValue & ((params: TValue) => VNodeChild) {
  return isFunction(value)
}

function formatCellValue(options: { value: unknown }) {
  if (options.value == null) {
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
      return undefined
    }

    return value[key]
  }, options.row)
}
