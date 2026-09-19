import type { DropdownMenuItem } from '@nuxt/ui/components/DropdownMenu.vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import type { TableSchemaView } from '../../types'
import { findSchemaColumn } from './schema'

export function createColumnMenuItems(options: {
  columnId: string
  label?: string
  schema: TableSchemaView
  orderedColumns: { id: string; sortableKey?: string }[]
  getSortState: (options: { columnId: string }) => 'asc' | 'desc' | null
  getPinnedState: (options: { columnId: string }) => 'left' | 'right' | null
  setPinning: (options: { columnId: string; pinned?: 'left' | 'right' }) => void
  setVisibility: (options: { columnId: string; visible: boolean }) => void
  setSorting: (options: { key: string; dir: 'asc' | 'desc' } | null) => void
}): DropdownMenuItem[][] {
  const { t } = useUiToolsLocale()
  const column = options.orderedColumns.find((entry) => entry.id === options.columnId)
  const sortableKey = column?.sortableKey
  const schemaColumn = findSchemaColumn({ columnId: options.columnId, schema: options.schema })
  const sortState = options.getSortState({ columnId: options.columnId })
  const pinnedState = options.getPinnedState({ columnId: options.columnId })
  const activeClass = 'nut-dl-colmenu__item--active'

  const sortGroup: DropdownMenuItem[] = sortableKey
    ? [
        {
          class: sortState === 'asc' ? activeClass : undefined,
          icon: 'i-lucide-arrow-up',
          label: t('table.columnsMenu.sortAsc'),
          onSelect: () => options.setSorting({ dir: 'asc', key: sortableKey }),
        },
        {
          class: sortState === 'desc' ? activeClass : undefined,
          icon: 'i-lucide-arrow-down',
          label: t('table.columnsMenu.sortDesc'),
          onSelect: () => options.setSorting({ dir: 'desc', key: sortableKey }),
        },
        {
          disabled: !sortState,
          icon: 'i-lucide-arrow-up-down',
          label: t('table.columnsMenu.clearSort'),
          onSelect: () => options.setSorting(null),
        },
      ]
    : []

  const pinGroup: DropdownMenuItem[] = pinnedState
    ? [
        {
          icon: 'i-lucide-pin-off',
          label: t('table.columnsMenu.unpinColumn'),
          onSelect: () => options.setPinning({ columnId: options.columnId }),
        },
      ]
    : [
        {
          icon: 'i-lucide-pin',
          label: t('table.columnsMenu.pinToLeft'),
          onSelect: () => options.setPinning({ columnId: options.columnId, pinned: 'left' }),
        },
        {
          icon: 'i-lucide-pin',
          label: t('table.columnsMenu.pinToRight'),
          onSelect: () => options.setPinning({ columnId: options.columnId, pinned: 'right' }),
        },
      ]

  const hideGroup: DropdownMenuItem[] = [
    {
      disabled: Boolean(schemaColumn?.required),
      icon: 'i-lucide-eye-off',
      label: t('table.columnsMenu.hideColumn'),
      onSelect: () => options.setVisibility({ columnId: options.columnId, visible: false }),
    },
  ]

  const titleGroup: DropdownMenuItem[] = options.label
    ? [{ class: 'nut-dl-colmenu__title', label: options.label, type: 'label' }]
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
  if (sortState === 'asc') {
    return 'i-lucide-arrow-up'
  }
  if (sortState === 'desc') {
    return 'i-lucide-arrow-down'
  }
  return options.canHide ? 'i-lucide-chevrons-up-down' : 'i-lucide-grip-vertical'
}
