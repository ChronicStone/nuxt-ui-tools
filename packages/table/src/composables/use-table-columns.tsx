/// <reference types="vue/jsx" />

import { computed, watch, type ComputedRef, type Ref } from 'vue'

import UCheckbox from '@nuxt/ui/components/Checkbox.vue'
import UDropdownMenu from '@nuxt/ui/components/DropdownMenu.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

import type { TableColumn, TableLayout } from '../types'
import type { TableRuntimeColumn } from './use-table-internals'

const SELECT_COLUMN_ID = '__select'

export function useTableColumns(params: {
  schema: any
  data: any
  query: any
  api: any
  tableLayout: ComputedRef<TableLayout>
  tableState: Ref<Record<string, any>>
}) {
  const runtimeColumns = computed<TableRuntimeColumn[]>(() =>
    (params.schema.value.table?.columns ?? [])
      .filter((column: TableColumn) => (column.condition?.() ?? true) && (column.enabled ?? true))
      .map((column: TableColumn) => ({
        id: column.key,
        label: resolveColumnLabel(column),
        icon: column.icon,
        sortableKey: getSortableKey(column),
        canHide: !column.required,
        defaultVisible: resolveColumnVisibility({
          column,
          context: params.data.contextData.value,
        }),
      })),
  )

  const orderedColumns = computed(() => {
    const lookup = new Map(runtimeColumns.value.map((column) => [column.id, column]))
    const orderedIds = [
      ...(params.tableState.value.columnOrder ?? []),
      ...runtimeColumns.value.map((column) => column.id),
    ]

    return unique(orderedIds)
      .map((id) => lookup.get(id))
      .filter((column): column is TableRuntimeColumn => Boolean(column))
  })

  const selectedRowCount = computed(() =>
    Object.values(params.tableState.value.rowSelection ?? {}).filter(Boolean).length,
  )

  watch(
    runtimeColumns,
    (columns) => {
      const columnIds = columns.map((column) => column.id)
      const existingOrder = (params.tableState.value.columnOrder ?? []).filter(
        (columnId: string) => columnIds.includes(columnId),
      )
      const defaultOrder = columns.map((column) => column.id)
      const nextVisibility = Object.fromEntries(
        columns.map((column) => [
          column.id,
          params.tableState.value.columnVisibility?.[column.id] ?? column.defaultVisible,
        ]),
      )
      const pinnedLeft = unique([
        SELECT_COLUMN_ID,
        ...columns
          .filter((column) => findSchemaColumn({ schema: params.schema.value, columnId: column.id })?.pinned === 'left')
          .map((column) => column.id),
        ...((params.tableState.value.columnPinning?.left as string[] | undefined) ?? []).filter(
          (columnId) => columnIds.includes(columnId),
        ),
      ])
      const pinnedRight = unique([
        ...columns
          .filter((column) => findSchemaColumn({ schema: params.schema.value, columnId: column.id })?.pinned === 'right')
          .map((column) => column.id),
        ...((params.tableState.value.columnPinning?.right as string[] | undefined) ?? []).filter(
          (columnId) => columnIds.includes(columnId),
        ),
      ])

      params.tableState.value = {
        ...params.tableState.value,
        columnOrder: unique([...existingOrder, ...defaultOrder]),
        columnVisibility: nextVisibility,
        columnPinning: {
          left: pinnedLeft,
          right: pinnedRight.filter((columnId) => !pinnedLeft.includes(columnId)),
        },
      }
    },
    { immediate: true },
  )

  watch(
    () => params.query.value.sorting,
    (sorting) => {
      params.tableState.value = {
        ...params.tableState.value,
        sorting: sorting?.sortKey
          ? [{ id: sorting.sortKey, desc: sorting.sortDirection === 'desc' }]
          : [],
      }
    },
    { immediate: true },
  )

  function getSortState(columnId: string) {
    const column = orderedColumns.value.find((entry) => entry.id === columnId)
    const sorting = params.query.value.sorting

    if (!column?.sortableKey || sorting?.sortKey !== column.sortableKey) {
      return null
    }

    return sorting.sortDirection
  }

  function getPinnedState(columnId: string) {
    if (params.tableState.value.columnPinning?.left?.includes(columnId)) {
      return 'left'
    }

    if (params.tableState.value.columnPinning?.right?.includes(columnId)) {
      return 'right'
    }

    return null
  }

  function setVisibility(options: {
    columnId: string
    visible: boolean
  }) {
    params.tableState.value = {
      ...params.tableState.value,
      columnVisibility: {
        ...params.tableState.value.columnVisibility,
        [options.columnId]: options.visible,
      },
    }
  }

  function setPinning(options: {
    columnId: string
    pinned?: 'left' | 'right'
  }) {
    const left = ((params.tableState.value.columnPinning?.left as string[] | undefined) ?? []).filter(
      (id) => id !== options.columnId,
    )
    const right = ((params.tableState.value.columnPinning?.right as string[] | undefined) ?? []).filter(
      (id) => id !== options.columnId,
    )

    if (options.pinned === 'left') {
      left.push(options.columnId)
    } else if (options.pinned === 'right') {
      right.push(options.columnId)
    }

    params.tableState.value = {
      ...params.tableState.value,
      columnPinning: {
        left: unique([SELECT_COLUMN_ID, ...left]),
        right: unique(right.filter((id) => id !== SELECT_COLUMN_ID)),
      },
    }
  }

  function setOrder(columnIds: string[]) {
    params.tableState.value = {
      ...params.tableState.value,
      columnOrder: unique(columnIds),
    }
  }

  function reset() {
    params.tableState.value = {
      ...params.tableState.value,
      columnOrder: runtimeColumns.value.map((column) => column.id),
      columnVisibility: Object.fromEntries(
        runtimeColumns.value.map((column) => [column.id, column.defaultVisible]),
      ),
      columnPinning: {
        left: unique([
          SELECT_COLUMN_ID,
          ...runtimeColumns.value
            .filter((column) => findSchemaColumn({ schema: params.schema.value, columnId: column.id })?.pinned === 'left')
            .map((column) => column.id),
        ]),
        right: runtimeColumns.value
          .filter((column) => findSchemaColumn({ schema: params.schema.value, columnId: column.id })?.pinned === 'right')
          .map((column) => column.id),
      },
      columnSizing: {},
      columnSizingInfo: {},
    }
  }

  function getMenuItems(columnId: string) {
    const column = orderedColumns.value.find((entry) => entry.id === columnId)
    const schemaColumn = findSchemaColumn({ schema: params.schema.value, columnId })
    const sortState = getSortState(columnId)
    const pinnedState = getPinnedState(columnId)

    return [
      column?.sortableKey
        ? [
            {
              label: 'Sort asc',
              icon: sortState === 'asc' ? 'i-lucide-check' : 'i-lucide-chevron-up',
              onSelect: () =>
                params.api.setSorting({
                  key: column.sortableKey as string,
                  dir: 'asc',
                }),
            },
            {
              label: 'Sort desc',
              icon: sortState === 'desc' ? 'i-lucide-check' : 'i-lucide-chevron-down',
              onSelect: () =>
                params.api.setSorting({
                  key: column.sortableKey as string,
                  dir: 'desc',
                }),
            },
          ]
        : [],
      [
        {
          label: 'Pin to left',
          icon: pinnedState === 'left' ? 'i-lucide-check' : 'i-lucide-pin',
            onSelect: () => setPinning({ columnId, pinned: 'left' }),
        },
        {
          label: 'Pin to right',
          icon: pinnedState === 'right' ? 'i-lucide-check' : 'i-lucide-pin',
          onSelect: () => setPinning({ columnId, pinned: 'right' }),
        },
        ...(pinnedState
          ? [
              {
                label: 'Unpin column',
                icon: 'i-lucide-pin-off',
                onSelect: () => setPinning({ columnId }),
              },
            ]
          : []),
      ],
      schemaColumn?.required
        ? []
        : [
            {
              label: 'Hide column',
              icon: 'i-lucide-eye-off',
              onSelect: () => setVisibility({ columnId, visible: false }),
            },
          ],
    ].filter((group) => group.length > 0)
  }

  const tableColumns = computed(() => {
    const selectionColumn = {
      id: SELECT_COLUMN_ID,
      header: ({ table }: { table: any }) => (
        <UCheckbox
          modelValue={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? 'indeterminate'
                : false
          }
          color="neutral"
          ui={{ root: 'items-center' }}
          onUpdate:modelValue={(value: boolean | 'indeterminate') =>
            table.toggleAllPageRowsSelected(Boolean(value))}
        />
      ),
      cell: ({ row }: { row: any }) => (
        <UCheckbox
          modelValue={row.getIsSelected()}
          color="neutral"
          ui={{ root: 'items-center' }}
          onUpdate:modelValue={(value: boolean | 'indeterminate') =>
            row.toggleSelected(Boolean(value))}
        />
      ),
      size: 56,
      enableSorting: false,
      enableHiding: false,
      meta: {
        class: {
          th: 'w-14 px-4',
          td: 'w-14 px-4',
        },
      },
    }

    const dataColumns = orderedColumns.value
      .map((runtimeColumn) => {
        const column = findSchemaColumn({
          schema: params.schema.value,
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
            <UDropdownMenu
              items={getMenuItems(runtimeColumn.id)}
              content={{ align: 'start', side: 'bottom', sideOffset: 10 }}
              modal={false}
              ui={{ content: 'w-56 rounded-lg p-1' }}
            >
              <button
                type="button"
                class="inline-flex h-7 items-center gap-2 rounded-md px-2.5 text-left text-sm text-default transition-colors hover:bg-elevated"
              >
                <div class="flex min-w-0 items-center gap-2.5">
                  {runtimeColumn.icon ? (
                    <UIcon name={runtimeColumn.icon} class="size-4 shrink-0 text-muted" />
                  ) : null}
                  <span class="truncate">{runtimeColumn.label}</span>
                </div>
                <UIcon
                  name={getHeaderIcon(runtimeColumn.id, {
                    getCanHide: tableColumn.getCanHide,
                    getSortState,
                    getPinnedState,
                  })}
                  class="size-4 shrink-0 text-muted"
                />
              </button>
            </UDropdownMenu>
          ),
          cell: ({ row }: { row: { original: Record<string, any> } }) =>
            renderColumnCell({
              column,
              row: row.original,
              params,
            }),
          enableSorting: false,
          enableHiding: runtimeColumn.canHide,
          size: normalizeColumnSize(column.width),
          minSize: normalizeColumnSize(column.minWidth) ?? 120,
          meta: {
            class: {
              th: getColumnHeaderClass(column),
              td: getColumnCellClass(column),
            },
          },
        }
      })
      .filter(
        (
          column,
        ): column is Exclude<typeof column, null> => column !== null,
      )

    return [selectionColumn, ...dataColumns]
  })

  return {
    tableState: params.tableState,
    tableColumns,
    runtimeColumns,
    orderedColumns,
    selectedRowCount,
    reset,
    setVisibility,
    setPinning,
    setOrder,
    getSortState,
    getPinnedState,
    getMenuItems,
  }
}

function findSchemaColumn(options: {
  schema: any
  columnId: string
}) {
  return (options.schema.table?.columns ?? []).find(
    (column: TableColumn) => column.key === options.columnId,
  )
}

function resolveColumnLabel(column: TableColumn) {
  if (typeof column.label === 'function') {
    return String(column.label())
  }

  if (column.label) {
    return column.label
  }

  return humanizeKey(column.key)
}

function resolveColumnVisibility(options: {
  column: TableColumn
  context: Record<string, any>
}) {
  if (typeof options.column.visible === 'function') {
    return options.column.visible(options.context)
  }

  return options.column.visible ?? true
}

function getSortableKey(column: TableColumn) {
  if (column.kind === 'field' && column.sortable !== false) {
    return column.field
  }

  if (column.kind === 'composite') {
    return column.sortableKey
  }

  return undefined
}

function getHeaderIcon(
  columnId: string,
  controls: {
    getSortState: (columnId: string) => 'asc' | 'desc' | null
    getPinnedState: (columnId: string) => 'left' | 'right' | null
    getCanHide?: () => boolean
  },
) {
  const sortState = controls.getSortState(columnId)

  if (sortState === 'asc') {
    return 'i-lucide-arrow-up'
  }

  if (sortState === 'desc') {
    return 'i-lucide-arrow-down'
  }

  if (controls.getPinnedState(columnId)) {
    return 'i-lucide-pin'
  }

  return controls.getCanHide?.() ? 'i-lucide-chevrons-up-down' : 'i-lucide-grip-vertical'
}

function renderColumnCell(options: {
  column: TableColumn
  row: Record<string, any>
  params: any
}) {
  const cellParams = {
    row: options.row,
    index: Number(options.row.__$rowIndex ?? 0),
    context: options.params.data.contextData.value,
    pageContext: options.params.data.pageContextData.value,
    layout: options.params.tableLayout.value,
  }

  if (options.column.kind === 'field') {
    const value = getPathValue({
      row: options.row,
      path: options.column.field,
    })

    if (options.column.render) {
      return options.column.render({
        ...cellParams,
        value,
      })
    }

    return formatCellValue(value)
  }

  return options.column.render(cellParams)
}

function getColumnHeaderClass(column: TableColumn) {
  return [
    'bg-default',
    column.labelAlign === 'right' ? 'text-right' : '',
    column.labelAlign === 'center' ? 'text-center' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function getColumnCellClass(column: TableColumn) {
  return [
    column.align === 'right' ? 'text-right' : '',
    column.align === 'center' ? 'text-center' : '',
    column.ellipsis ? 'max-w-0 truncate' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function normalizeColumnSize(value: number | string | undefined) {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const numericValue = Number.parseInt(value, 10)
    return Number.isFinite(numericValue) ? numericValue : undefined
  }

  return undefined
}

function formatCellValue(value: unknown): string {
  if (value == null || value === '') {
    return '—'
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatCellValue(item)).join(', ')
  }

  if (value instanceof Date) {
    return value.toLocaleDateString()
  }

  if (typeof value === 'boolean') {
    return value ? 'True' : 'False'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

function getPathValue(options: {
  row: Record<string, any>
  path: string
}) {
  return options.path.split('.').reduce<unknown>((value, key) => {
    if (value == null) {
      return undefined
    }

    return (value as Record<string, unknown>)[key]
  }, options.row)
}

function humanizeKey(value: string) {
  return value
    .split('.')
    .at(-1)
    ?.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase()) ?? value
}

function unique<TValue>(values: TValue[]) {
  return [...new Set(values)]
}
