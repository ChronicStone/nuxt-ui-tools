import type { DropdownMenuItem } from '@nuxt/ui/components/DropdownMenu.vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import type { TableSchemaView } from '../../types'
import { findSchemaColumn } from './schema'

export function createColumnMenuItems(options: {
  columnId: string
  schema: TableSchemaView
  orderedColumns: Array<{ id: string; sortableKey?: string }>
  getSortState: (options: { columnId: string }) => 'asc' | 'desc' | null
  getPinnedState: (options: { columnId: string }) => 'left' | 'right' | null
  setPinning: (options: { columnId: string; pinned?: 'left' | 'right' }) => void
  setVisibility: (options: { columnId: string; visible: boolean }) => void
  setSorting: (options: { key: string; dir: 'asc' | 'desc' } | null) => void
}): DropdownMenuItem[][] {
  const { t } = useUiToolsLocale()
  const column = options.orderedColumns.find((entry) => entry.id === options.columnId)
  const sortableKey = column?.sortableKey
  const schemaColumn = findSchemaColumn({ schema: options.schema, columnId: options.columnId })
  const sortState = options.getSortState({ columnId: options.columnId })
  const pinnedState = options.getPinnedState({ columnId: options.columnId })

  return [
    sortableKey
      ? [
          {
            label: t('table.columnsMenu.sortAsc'),
            icon: sortState === 'asc' ? 'i-lucide-check' : 'i-lucide-chevron-up',
            color: 'neutral' as const,
            onSelect: () =>
              options.setSorting({
                key: sortableKey,
                dir: 'asc',
              }),
          },
          {
            label: t('table.columnsMenu.sortDesc'),
            icon: sortState === 'desc' ? 'i-lucide-check' : 'i-lucide-chevron-down',
            color: 'neutral' as const,
            onSelect: () =>
              options.setSorting({
                key: sortableKey,
                dir: 'desc',
              }),
          },
          ...(sortState
            ? [
                {
                  label: t('table.columnsMenu.clearSort'),
                  icon: 'i-lucide-x',
                  color: 'neutral' as const,
                  onSelect: () => options.setSorting(null),
                },
              ]
            : []),
        ]
      : [],
    [
      {
        label: t('table.columnsMenu.pinToLeft'),
        icon: pinnedState === 'left' ? 'i-lucide-check' : 'i-lucide-pin',
        color: 'neutral' as const,
        onSelect: () => options.setPinning({ columnId: options.columnId, pinned: 'left' }),
      },
      {
        label: t('table.columnsMenu.pinToRight'),
        icon: pinnedState === 'right' ? 'i-lucide-check' : 'i-lucide-pin',
        color: 'neutral' as const,
        onSelect: () => options.setPinning({ columnId: options.columnId, pinned: 'right' }),
      },
      ...(pinnedState
        ? [
            {
              label: t('table.columnsMenu.unpinColumn'),
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
            label: t('table.columnsMenu.hideColumn'),
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
