import { computed, type ComputedRef } from 'vue'

import type { UseTableApi } from './use-table-api'

export interface UseTablePaginationParams {
  rowCount: ComputedRef<number>
  pagination: ComputedRef<{ pageIndex: number; pageSize: number }>
  api: Pick<UseTableApi, 'setPage' | 'setPageSize'>
}

export function useTablePagination(options: UseTablePaginationParams) {
  const rowCount = computed(() => options.rowCount.value)
  const currentPage = computed(() => options.pagination.value.pageIndex)
  const pageSize = computed(() => options.pagination.value.pageSize)
  const totalPages = computed(() =>
    Math.max(1, Math.ceil(rowCount.value / Math.max(1, pageSize.value))),
  )
  const canPreviousPage = computed(() => currentPage.value > 1)
  const canNextPage = computed(() => currentPage.value < totalPages.value)

  function setPage(page: number) {
    options.api.setPage(Math.max(1, Math.min(page, totalPages.value)))
  }

  function setPageSize(nextPageSize: number) {
    options.api.setPageSize(nextPageSize)
  }

  return {
    rowCount,
    currentPage,
    pageSize,
    totalPages,
    canPreviousPage,
    canNextPage,
    setPage,
    setPageSize,
  }
}
