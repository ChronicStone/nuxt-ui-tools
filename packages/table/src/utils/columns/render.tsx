/// <reference types="vue/jsx" />

import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

import type { TableColumn } from '../../types'

import { getColumnHeaderIcon } from './menu'
import { findSchemaColumn } from './schema'
import {
  SELECT_COLUMN_ID,
  SELECT_COLUMN_WIDTH,
  type TableCellRenderContext,
  type TableColumnRenderParams,
  type TableRuntimeColumn,
  type UseTableColumnsParams,
} from './types'

export function createSelectionColumn(options: {
  params: UseTableColumnsParams
}) {
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
          ui={{ root: 'pointer-events-none items-center' }}
        />
      </button>
    ),
    cell: ({ row }: { row: any }) => (
      <button
        type="button"
        class="inline-flex items-center"
        onClick={(event: MouseEvent) => {
          event.preventDefault()
          event.stopPropagation()

          const rowId = String(row.original?.__$rowId ?? row.id)

          options.params.selection.toggleRowSelection({
            rowId,
            selected: !options.params.selection.isRowSelected({ rowId }),
            shiftKey: event.shiftKey,
          })
        }}
      >
        <UCheckbox
          modelValue={options.params.selection.isRowSelected({ rowId: String(row.original?.__$rowId ?? row.id) })}
          color="neutral"
          ui={{ root: 'pointer-events-none items-center' }}
        />
      </button>
    ),
    size: SELECT_COLUMN_WIDTH,
    enableSorting: false,
    enableHiding: false,
    enablePinning: true,
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
  getMenuItems: (options: { columnId: string }) => any[]
  getPinnedState: (options: { columnId: string }) => 'left' | 'right' | null
  getSortState: (options: { columnId: string }) => 'asc' | 'desc' | null
}) {
  return options.visibleOrderedColumns
    .map((runtimeColumn) => {
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
            ? (row: Record<string, any>) => getPathValue({ row, path: column.field })
            : undefined,
        header: ({ column: tableColumn }: { column: any }) => (
          <div class="group/column-header relative flex h-full items-center pr-0.5">
            <UDropdownMenu
              items={options.getMenuItems({ columnId: runtimeColumn.id })}
              content={{ align: 'start', side: 'bottom', sideOffset: 10 }}
              modal={false}
              ui={{ content: 'w-56 rounded-lg p-1' }}
            >
              <button
                type="button"
                class="inline-flex h-8 max-w-full items-center gap-2 rounded-md px-2.5 text-left text-sm text-default transition-colors hover:bg-elevated"
              >
                <div class="flex min-w-0 items-center gap-2.5">
                  {runtimeColumn.icon ? (
                    <UIcon name={runtimeColumn.icon} class="size-4 shrink-0 text-muted" />
                  ) : null}
                  <span class="truncate">{runtimeColumn.label}</span>
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
              <button
                type="button"
                aria-label={`Resize ${runtimeColumn.label} column`}
                class={[
                  'absolute inset-y-1.5 right-0 z-10 flex w-3 translate-x-1/2 cursor-col-resize touch-none items-center justify-center',
                  'rounded-full transition-colors',
                  'opacity-70 hover:bg-elevated focus-visible:bg-elevated',
                  tableColumn.getIsResizing?.() ? 'opacity-100 bg-elevated' : '',
                ]}
                onClick={(event: MouseEvent) => {
                  event.preventDefault()
                  event.stopPropagation()
                }}
                onDblclick={(event: MouseEvent) => {
                  event.preventDefault()
                  event.stopPropagation()
                  tableColumn.resetSize?.()
                }}
                onMousedown={(event: MouseEvent) => {
                  event.preventDefault()
                  event.stopPropagation()
                  tableColumn.getResizeHandler?.()(event)
                }}
                onTouchstart={(event: TouchEvent) => {
                  event.stopPropagation()
                  tableColumn.getResizeHandler?.()(event)
                }}
              >
                <span
                  class={[
                    'h-4 w-px rounded-full bg-default/35 transition-colors',
                    'group-hover/column-header:bg-default/55',
                    tableColumn.getIsResizing?.() ? '!bg-primary' : '',
                  ]}
                />
              </button>
            ) : null}
          </div>
        ),
        cell: ({ row }: { row: { original: Record<string, any> } }) =>
          renderColumnCell({
            column,
            row: row.original,
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
    params: options.params,
  })

  if (options.column.kind === 'field') {
    const value = getPathValue({
      row: options.row,
      path: options.column.field,
    })

    if (options.column.render) {
      return wrapEllipsisContent({
        column: options.column,
        content: options.column.render({
          ...cellContext,
          value,
        }),
        title: resolveEllipsisTitle({
          column: options.column,
          params: {
            ...cellContext,
            value,
          },
          fallbackValue: value,
        }),
      })
    }

    return wrapEllipsisContent({
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
    })
  }

  return wrapEllipsisContent({
    column: options.column,
    content: options.column.render(cellContext),
    title: resolveEllipsisTitle({
      column: options.column,
      params: cellContext,
      fallbackValue: null,
    }),
  })
}

export function wrapEllipsisContent(options: {
  column: TableColumn
  content: any
  title?: string | null
}) {
  const baseClass = 'min-w-0 max-w-full overflow-hidden'

  if (!options.column.ellipsis) {
    return <div class={baseClass}>{options.content}</div>
  }

  return (
    <div
      class={`${baseClass} text-ellipsis whitespace-nowrap`}
      title={options.title ?? undefined}
    >
      {options.content}
    </div>
  )
}

export function getColumnHeaderClass(options: {
  column: TableColumn
}) {
  return [
    'bg-default',
    options.column.labelAlign === 'right' ? 'text-right' : '',
    options.column.labelAlign === 'center' ? 'text-center' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

export function getColumnCellClass(options: {
  column: TableColumn
}) {
  return [
    'overflow-hidden',
    options.column.align === 'right' ? 'text-right' : '',
    options.column.align === 'center' ? 'text-center' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

export function normalizeColumnSize(options: {
  size?: number | string
}) {
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
  row: Record<string, any>
  params: UseTableColumnsParams
}): TableCellRenderContext {
  return {
    row: options.row,
    index: Number(options.row.__$rowIndex ?? 0),
    context: options.params.data.contextData.value,
    pageContext: options.params.data.pageContextData.value,
    layout: options.params.tableLayout.value,
  }
}

function resolveEllipsisTitle(options: {
  column: TableColumn
  params: Record<string, any>
  fallbackValue: unknown
}) {
  if (!options.column.ellipsis) {
    return null
  }

  if (typeof options.column.ellipsis === 'object' && options.column.ellipsis !== null) {
    const title = (options.column.ellipsis as { title?: unknown }).title

    if (typeof title === 'function') {
      return String((title as (params: Record<string, any>) => unknown)(options.params))
    }

    if (title != null) {
      return String(title)
    }
  }

  return options.fallbackValue == null ? null : String(options.fallbackValue)
}

function formatCellValue(options: {
  value: unknown
}) {
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

function getPathValue(options: {
  row: Record<string, any>
  path: string
}) {
  return options.path.split('.').reduce<unknown>((value, key) => {
    if (value == null || typeof value !== 'object') {
      return undefined
    }

    return (value as Record<string, unknown>)[key]
  }, options.row)
}
