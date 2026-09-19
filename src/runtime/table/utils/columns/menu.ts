import type { DropdownMenuItem } from '@nuxt/ui/components/DropdownMenu.vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import type { TableSchemaView } from '../../types'
import { findSchemaColumn } from './schema'

export function createColumnMenuItems(options: {
  columnId: string
  label?: string
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
  const activeClass = 'nut-dl-colmenu__item--active'

  const sortGroup: DropdownMenuItem[] = sortableKey
    ? [
        {
          label: t('table.columnsMenu.sortAsc'),
          icon: 'i-lucide-arrow-up',
          class: sortState === 'asc' ? activeClass : undefined,
          onSelect: () => options.setSorting({ key: sortableKey, dir: 'asc' }),
        },
        {
          label: t('table.columnsMenu.sortDesc'),
          icon: 'i-lucide-arrow-down',
          class: sortState === 'desc' ? activeClass : undefined,
          onSelect: () => options.setSorting({ key: sortableKey, dir: 'desc' }),
        },
        {
          label: t('table.columnsMenu.clearSort'),
          icon: 'i-lucide-arrow-up-down',
          disabled: !sortState,
          onSelect: () => options.setSorting(null),
        },
      ]
    : []

  const pinGroup: DropdownMenuItem[] = pinnedState
    ? [
        {
          label: t('table.columnsMenu.unpinColumn'),
          icon: 'i-lucide-pin-off',
          onSelect: () => options.setPinning({ columnId: options.columnId }),
        },
      ]
    : [
        {
          label: t('table.columnsMenu.pinToLeft'),
          icon: 'i-lucide-pin',
          onSelect: () => options.setPinning({ columnId: options.columnId, pinned: 'left' }),
        },
        {
          label: t('table.columnsMenu.pinToRight'),
          icon: 'i-lucide-pin',
          onSelect: () => options.setPinning({ columnId: options.columnId, pinned: 'right' }),
        },
      ]

  const hideGroup: DropdownMenuItem[] = [
    {
      label: t('table.columnsMenu.hideColumn'),
      icon: 'i-lucide-eye-off',
      disabled: Boolean(schemaColumn?.required),
      onSelect: () => options.setVisibility({ columnId: options.columnId, visible: false }),
    },
  ]

  const titleGroup: DropdownMenuItem[] = options.label
    ? [{ label: options.label, type: 'label', class: 'nut-dl-colmenu__title' }]
    : []

  return [titleGroup, sortGroup, pinGroup, hideGroup].filter((group) => group.length > 0)
}

export function getColumnHeaderIcon(options: {
  columnId: string
  getSortState: (options: { columnId: string }) => 'asc' | 'desc' | null
  getPinnedState: (options: { columnId: string }) => 'left' | 'right' | null
  canHide?: boolean
}) {
  const sortState = options.getSortState({ columnId: options.columnId })
  if (sortState === 'asc') return 'i-lucide-arrow-up'
  if (sortState === 'desc') return 'i-lucide-arrow-down'
  return options.canHide ? 'i-lucide-chevrons-up-down' : 'i-lucide-grip-vertical'
}
