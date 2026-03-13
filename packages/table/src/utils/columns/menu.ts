import { findSchemaColumn } from './schema'

export function createColumnMenuItems(options: {
  columnId: string
  schema: any
  orderedColumns: Array<{ id: string; sortableKey?: string }>
  getSortState: (options: { columnId: string }) => 'asc' | 'desc' | null
  getPinnedState: (options: { columnId: string }) => 'left' | 'right' | null
  setPinning: (options: { columnId: string; pinned?: 'left' | 'right' }) => void
  setVisibility: (options: { columnId: string; visible: boolean }) => void
  setSorting: (options: { key: string; dir: 'asc' | 'desc' } | null) => void
}) {
  const column = options.orderedColumns.find((entry) => entry.id === options.columnId)
  const schemaColumn = findSchemaColumn({ schema: options.schema, columnId: options.columnId })
  const sortState = options.getSortState({ columnId: options.columnId })
  const pinnedState = options.getPinnedState({ columnId: options.columnId })

  return [
    column?.sortableKey
      ? [
          {
            label: 'Sort asc',
            icon: sortState === 'asc' ? 'i-lucide-check' : 'i-lucide-chevron-up',
            onSelect: () =>
              options.setSorting({
                key: column.sortableKey as string,
                dir: 'asc',
              }),
          },
          {
            label: 'Sort desc',
            icon: sortState === 'desc' ? 'i-lucide-check' : 'i-lucide-chevron-down',
            onSelect: () =>
              options.setSorting({
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
        onSelect: () => options.setPinning({ columnId: options.columnId, pinned: 'left' }),
      },
      {
        label: 'Pin to right',
        icon: pinnedState === 'right' ? 'i-lucide-check' : 'i-lucide-pin',
        onSelect: () => options.setPinning({ columnId: options.columnId, pinned: 'right' }),
      },
      ...(pinnedState
        ? [
            {
              label: 'Unpin column',
              icon: 'i-lucide-pin-off',
              onSelect: () => options.setPinning({ columnId: options.columnId }),
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
            onSelect: () => options.setVisibility({ columnId: options.columnId, visible: false }),
          },
        ],
  ].filter((group) => group.length > 0)
}

export function getColumnHeaderIcon(options: {
  columnId: string
  getSortState: (options: { columnId: string }) => 'asc' | 'desc' | null
  getPinnedState: (options: { columnId: string }) => 'left' | 'right' | null
  canHide?: boolean
}) {
  const sortState = options.getSortState({ columnId: options.columnId })

  if (sortState === 'asc') {
    return 'i-lucide-arrow-up'
  }

  if (sortState === 'desc') {
    return 'i-lucide-arrow-down'
  }

  return options.canHide ? 'i-lucide-chevrons-up-down' : 'i-lucide-grip-vertical'
}
