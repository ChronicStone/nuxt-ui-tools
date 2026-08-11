import { inject, provide, type ComputedRef, type InjectionKey } from 'vue'

import type { GenericObject, TableRowActionContext } from '../types'

const TABLE_ROW_ACTION_SCOPE_KEY = Symbol('nuxt-ui-tools.table.row-actions-scope') as InjectionKey<
  ComputedRef<TableInjectedRowActionScope>
>

export type TableInjectedRowActionScope = TableRowActionContext<
  GenericObject,
  Record<string, unknown>,
  Record<string, unknown>
>

export function provideTableRowActionScope(scope: ComputedRef<TableInjectedRowActionScope>) {
  provide(TABLE_ROW_ACTION_SCOPE_KEY, scope)
}

export function useTableRowActionScope() {
  return inject(TABLE_ROW_ACTION_SCOPE_KEY, null)
}
