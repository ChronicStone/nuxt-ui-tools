import { inject, provide, type ComputedRef, type InjectionKey } from 'vue'

import type { GenericObject, TableRowActionContext, TableRuntimeRecord } from '../types'

// SAFETY: the symbol is module-private and all providers/injectors share this exact scope contract.
const TABLE_ROW_ACTION_SCOPE_KEY = Symbol('nuxt-ui-tools.table.row-actions-scope') as InjectionKey<
  ComputedRef<TableInjectedRowActionScope>
>

export type TableInjectedRowActionScope = TableRowActionContext<
  GenericObject,
  TableRuntimeRecord,
  TableRuntimeRecord
>

export function provideTableRowActionScope(scope: ComputedRef<TableInjectedRowActionScope>) {
  provide(TABLE_ROW_ACTION_SCOPE_KEY, scope)
}

export function useTableRowActionScope() {
  return inject(TABLE_ROW_ACTION_SCOPE_KEY, null)
}
