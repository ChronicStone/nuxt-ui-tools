/** @jsxImportSource vue */
/// <reference types="vue/jsx" />

import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import UButton from '@nuxt/ui/components/Button.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import type { VNodeChild } from 'vue'

import RowActions from '../../components/actions/RowActions.vue'
import TableRowScopeProvider from '../../components/actions/TableRowScopeProvider.vue'
import TableCellEllipsis from '../../components/table/TableCellEllipsis'
import type { GenericObject, TableApi, TableLayout } from '../../types'
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

type ColumnMenuItem = {
  label?: string
  icon?: string
  color?: string
  class?: string
  onSelect?: () => void
}

type CachedRowScope = {
  index: number
  scope: TableCellRenderContext
}

type RowScopeCacheState = {
  contextSource: object
  pageContextSource: object
  tableApi: TableApi<unknown>
  layout: TableLayout
  plainContext: Record<string, unknown>
  plainPageContext: Record<string, unknown>
  rowScopes: WeakMap<GenericObject, CachedRowScope>
}

const ROW_SCOPE_CACHE = new WeakMap<UseTableColumnsParams, RowScopeCacheState>()

export function createSelectionColumn(options: { params: UseTableColumnsParams }) {
  return {
    id: SELECT_COLUMN_ID,

    header: () => (
      <button
        type="button"
        class="inline-flex items-center"
        onClick={(event: MouseEvent) => {
          event.preventDefault()
          event.stopPropagation()
          options.params.selection.toggleAllRows({
            selected: !options.params.selection.allSelected.value,
          })
        }}
      >
        <UCheckbox
          modelValue={
            options.params.selection.allSelected.value
              ? true
              : options.params.selection.partiallySelected.value
                ? 'indeterminate'
                : false
          }
          color="neutral"
          ui={{ base: '!rounded-md', indicator: '!rounded-none' }}
        />
      </button>
    ),
    cell: ({ row }: { row: { id: string } }) => (
      <button
        type="button"
        class="inline-flex items-center"
        onClick={(event: MouseEvent) => {
          event.preventDefault()
          event.stopPropagation()

          const rowId = String(row.id)

          options.params.selection.toggleRowSelection({
            rowId,
            selected: !options.params.selection.isRowSelected({ rowId }),
            shiftKey: event.shiftKey,
          })
        }}
      >
        <UCheckbox
          modelValue={options.params.selection.isRowSelected({ rowId: String(row.id) })}
          color="neutral"
          ui={{ base: '!rounded-md', indicator: '!rounded-none' }}
        />
      </button>
    ),
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
  getMenuItems: (options: { columnId: string }) => ColumnMenuItem[][]
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
          <div class="group/column-header relative flex h-full w-full items-center">
            <UDropdownMenu
              items={options.getMenuItems({ columnId: runtimeColumn.id })}
              content={{ align: 'start', side: 'bottom', sideOffset: 10 }}
              modal={false}
              ui={{ content: 'w-fit p-1 shadow-none' }}
            >
              <button
                type="button"
                class="inline-flex h-8 min-w-0 max-w-full items-center gap-2 rounded-md px-2.5 text-left text-sm text-default transition-colors hover:bg-elevated"
              >
                <div class="flex min-w-0 items-center gap-2.5">
                  {runtimeColumn.icon ? (
                    <UIcon name={runtimeColumn.icon} class="size-4 shrink-0 text-muted" />
                  ) : null}
                  <TableCellEllipsis title={runtimeColumn.label} wrapperClass="min-w-0 max-w-full">
                    {runtimeColumn.label}
                  </TableCellEllipsis>
                </div>
                <UIcon
                  name={getColumnHeaderIcon({
                    columnId: runtimeColumn.id,
                    canHide: tableColumn.getCanHide?.(),
                    getSortState: options.getSortState,
                    getPinnedState: options.getPinnedState,
                  })}
                  class="size-4 shrink-0 text-muted"
                />
                {options.getPinnedState({ columnId: runtimeColumn.id }) ? (
                  <UIcon name="i-lucide-pin" class="size-3.5 shrink-0 text-muted" />
                ) : null}
              </button>
            </UDropdownMenu>

            {column.resizable !== false ? (
              <div
                aria-label={`Resize ${runtimeColumn.label} column`}
                role="separator"
                class={[
                  'absolute inset-y-1 -right-1 z-20 w-3 cursor-col-resize touch-none select-none opacity-0',
                  "transition-opacity duration-150 after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:rounded-full after:content-['']",
                  header.getIsResizing?.()
                    ? 'opacity-100 after:bg-primary'
                    : 'group-hover/table-head:opacity-100 hover:opacity-100 after:bg-accented/70',
                ]}
                onDblclick={(event: MouseEvent) => {
                  event.preventDefault()
                  event.stopPropagation()
                  tableColumn.resetSize?.()
                }}
                onMousedown={(event: MouseEvent) => {
                  event.preventDefault()
                  event.stopPropagation()
                  header.getResizeHandler?.()(event)
                }}
                onTouchstart={(event: TouchEvent) => {
                  event.stopPropagation()
                  header.getResizeHandler?.()(event)
                }}
              />
            ) : null}
          </div>
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
          content: options.column.render({
            ...cellContext,
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
  if (typeof options.size === 'number') {
    return options.size
  }

  if (typeof options.size === 'string') {
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
  const contextSource = options.params.data.contextData.value
  const pageContextSource = options.params.data.pageContextData.value
  const tableApi = options.params.tableApi.value
  if (!tableApi) throw new Error('Table API is not ready')
  const layout = options.params.tableLayout.value
  const cached = ROW_SCOPE_CACHE.get(options.params)

  if (
    cached &&
    cached.contextSource === contextSource &&
    cached.pageContextSource === pageContextSource &&
    cached.tableApi === tableApi &&
    cached.layout === layout
  ) {
    const cachedRowScope = cached.rowScopes.get(options.row)
    if (cachedRowScope && cachedRowScope.index === options.rowIndex) return cachedRowScope.scope

    const scope: TableCellRenderContext = {
      row: options.row,
      index: options.rowIndex,
      context: cached.plainContext,
      pageContext: cached.plainPageContext,
      tableApi,
      layout,
    }

    cached.rowScopes.set(options.row, {
      index: options.rowIndex,
      scope,
    })

    return scope
  }

  const nextCache: RowScopeCacheState = {
    contextSource,
    pageContextSource,
    tableApi,
    layout,
    plainContext: toPlainRecord(contextSource),
    plainPageContext: toPlainRecord(pageContextSource),
    rowScopes: new WeakMap(),
  }
  const scope: TableCellRenderContext = {
    row: options.row,
    index: options.rowIndex,
    context: nextCache.plainContext,
    pageContext: nextCache.plainPageContext,
    tableApi,
    layout,
  }

  nextCache.rowScopes.set(options.row, {
    index: options.rowIndex,
    scope,
  })
  ROW_SCOPE_CACHE.set(options.params, nextCache)

  return scope
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
          <div class="flex justify-end">
            <RowActions
              content={{ align: 'end', side: 'bottom', sideOffset: 8 }}
              modal={false}
              portal
              ui={{ content: 'z-[80] min-w-48' }}
            >
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-ellipsis-vertical"
                size="sm"
                square
                aria-label="Row actions"
                class="bg-transparent text-muted shadow-none ring-0 hover:bg-accented/60 hover:text-default focus-visible:bg-accented/60 focus-visible:text-default"
              />
            </RowActions>
          </div>
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

function wrapRowScope(options: {
  scope: TableCellRenderContext
  content: VNodeChild
}) {
  return <TableRowScopeProvider scope={options.scope}>{options.content}</TableRowScopeProvider>
}

function toPlainRecord(value: object) {
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

  if (typeof options.column.ellipsis === 'object' && options.column.ellipsis !== null) {
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

function isEllipsisTitleResolver(value: unknown): value is (params: unknown) => unknown {
  return typeof value === 'function'
}

function formatCellValue(options: { value: unknown }) {
  if (options.value == null) {
    return '—'
  }

  if (options.value instanceof Date) {
    return options.value.toLocaleString()
  }

  if (Array.isArray(options.value)) {
    return options.value.join(', ')
  }

  if (typeof options.value === 'object') {
    return JSON.stringify(options.value)
  }

  return String(options.value)
}

function getPathValue(options: { row: GenericObject; path: string }) {
  return options.path.split('.').reduce<unknown>((value, key) => {
    if (value == null || typeof value !== 'object') {
      return undefined
    }

    return (value as Record<string, unknown>)[key]
  }, options.row)
}
