import type { TableState } from '../types/state'

export function createTableState(initialState: Partial<TableState> = {}): TableState {
  return {
    layout: initialState.layout ?? 'table',
    pagination: {
      page: initialState.pagination?.page ?? 1,
      pageSize: initialState.pagination?.pageSize ?? 25,
    },
    sorting: initialState.sorting ?? [],
    filters: initialState.filters ?? {},
    search: initialState.search ?? '',
    selectedRowKeys: initialState.selectedRowKeys ?? [],
    ...initialState,
  }
}
