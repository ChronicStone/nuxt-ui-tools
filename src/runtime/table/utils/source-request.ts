import type { GenericObject, TableRemoteSourceRequest, TableSourceRequestContext } from '../types'

export function toTableRemoteSourceRequest<TRow extends GenericObject>(
  request: TableSourceRequestContext<TRow>,
): TableRemoteSourceRequest<TRow> {
  return {
    facets: request.facets,
    filters: request.filters.children.length > 0 ? [request.filters] : [],
    pagination: request.pagination.mode === 'none' ? undefined : request.pagination,
    search: request.search,
    sorting: request.sorting,
  }
}
