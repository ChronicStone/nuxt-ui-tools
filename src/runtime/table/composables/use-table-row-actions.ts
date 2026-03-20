import { computed, inject, provide, type ComputedRef, type InjectionKey } from 'vue'

import type { GenericObject, TableRowActionContext } from '../types'

const TABLE_ROW_ACTION_SCOPE_KEY = Symbol(
  'nuxt-ui-tools.table.row-actions-scope',
) as InjectionKey<TableInjectedRowActionScope | ComputedRef<TableInjectedRowActionScope>>

export type TableInjectedRowActionScope = TableRowActionContext<
  GenericObject,
  Record<string, unknown>,
  Record<string, unknown>
>

export function provideTableRowActionScope(
  scope: TableInjectedRowActionScope | ComputedRef<TableInjectedRowActionScope>,
) {
  provide(TABLE_ROW_ACTION_SCOPE_KEY, scope)
}

export function useTableRowActionScope() {
  const scope = inject(TABLE_ROW_ACTION_SCOPE_KEY, null)
  if (!scope) return null
  if (typeof scope === 'object' && 'value' in scope) return scope
  return computed(() => scope)
}
