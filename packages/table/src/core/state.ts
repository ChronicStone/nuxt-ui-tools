import type { TableState } from '../types/state'

export function createTableState<
  TFilterKey extends string = string,
  TSortKey extends string = string,
  TView extends string = string,
>(initialState: Partial<TableState<TFilterKey, TSortKey, TView>> = {}): TableState<TFilterKey, TSortKey, TView> {
  return {
    layout: initialState.layout ?? 'table',
    pagination: {
      page: initialState.pagination?.page ?? 1,
      pageSize: initialState.pagination?.pageSize ?? 25,
    },
    sorting: initialState.sorting ?? [],
    filters: initialState.filters ?? ({} as Partial<Record<TFilterKey, unknown>>),
    search: initialState.search ?? '',
    activeView: initialState.activeView ?? undefined,
    selectedRowKeys: initialState.selectedRowKeys ?? [],
  }
}
