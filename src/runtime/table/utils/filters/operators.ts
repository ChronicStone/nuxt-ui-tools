import { useUiToolsLocale } from '#ui-tools/i18n'

import type { TableFilterOperator } from '../../types'

export function getFilterOperatorLabel(options: { operator?: TableFilterOperator }) {
  const { t } = useUiToolsLocale()
  const operator = options.operator ?? 'is'
  return t(`table.filters.operators.${operator}`)
}
