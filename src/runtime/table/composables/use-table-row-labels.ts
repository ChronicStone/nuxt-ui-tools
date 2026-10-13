import { useUiToolsLocale } from '#ui-tools/i18n'

import { isNullish } from '../../shared/utils/predicate'
import type { GenericObject } from '../types'
import { useTableInternals } from './use-table-internals'

/** Locale keys of each control that names a record: with the schema's label, or by position. */
const ROW_NAME_KEYS = {
  actions: { named: 'table.rowActions.label', positioned: 'table.rowActions.labelAt' },
  select: { named: 'table.selection.selectRow', positioned: 'table.selection.selectRowAt' },
} as const

type RowNameKind = keyof typeof ROW_NAME_KEYS

/**
 * Accessible names for the controls of a record. A record is named by the schema's `rowLabel`;
 * without one, or when it returns nothing for this record, by its position on the page.
 */
export function useTableRowLabels() {
  const internals = useTableInternals()
  const { t } = useUiToolsLocale()

  function name(kind: RowNameKind, params: { row: GenericObject; index: number }) {
    const keys = ROW_NAME_KEYS[kind]
    const label = internals.schema.value.rowLabel?.(params.row)
    const text = isNullish(label) ? '' : String(label).trim()
    return text
      ? t(keys.named, { label: text })
      : t(keys.positioned, { position: params.index + 1 })
  }

  return {
    rowActions: (params: { row: GenericObject; index: number }) => name('actions', params),
    selectAll: () => t('table.selection.selectAll'),
    selectRow: (params: { row: GenericObject; index: number }) => name('select', params),
  }
}
