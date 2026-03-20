import { computed, watch, type ComputedRef } from 'vue'

import type { TableSchemaView } from '../types'
import { getDefaultPageSize, getPageSizeOptions } from '../utils'
import type { useTableData } from './use-table-data'
import type { useTableLayout } from './use-table-layout'
import type { useTableState } from './use-table-state'

export interface UseTablePaginationParams {
  schema: ComputedRef<TableSchemaView>
  layout: ReturnType<typeof useTableLayout>
  state: ReturnType<typeof useTableState>
  queryContent: ReturnType<typeof useTableData>
}

export function useTablePagination(options: UseTablePaginationParams) {
  const rowCount = computed(() => options.queryContent.data.value.rowCount)
  const currentPage = computed(() => options.state.queryState.pagination.value.pageIndex)
  const pageSize = computed(() => options.state.queryState.pagination.value.pageSize)
  const totalPages = computed(() =>
    Math.max(1, Math.ceil(rowCount.value / Math.max(1, pageSize.value))),
  )
  const canPreviousPage = computed(() => currentPage.value > 1)
  const canNextPage = computed(() => currentPage.value < totalPages.value)
  const state = computed(() => ({
    pageIndex: currentPage.value,
    pageSize: pageSize.value,
    pageCount: totalPages.value,
    hasNextPage: canNextPage.value,
    hasPreviousPage: canPreviousPage.value,
  }))
  const pageSizeOptions = computed(() =>
    getPageSizeOptions({
      schema: options.schema.value,
      layout: options.layout.activeLayout.value,
    }),
  )
  const compatiblePageSize = computed(() => {
    if (pageSizeOptions.value.includes(pageSize.value)) return pageSize.value

    return getDefaultPageSize({
      schema: options.schema.value,
      layout: options.layout.activeLayout.value,
    })
  })

  function setPage(page: number) {
    options.state.queryState.pagination.value = {
      ...options.state.queryState.pagination.value,
      pageIndex: Math.max(1, Math.min(page, totalPages.value)),
    }
  }

  function setPageSize(nextPageSize: number) {
    options.state.queryState.pagination.value = {
      pageIndex: 1,
      pageSize: nextPageSize,
    }
  }

  function next() {
    setPage(currentPage.value + 1)
  }

  function previous() {
    setPage(currentPage.value - 1)
  }

  function reset() {
    setPageSize(
      getDefaultPageSize({
        schema: options.schema.value,
        layout: options.layout.activeLayout.value,
      }),
    )
  }

  watch(
    [pageSizeOptions, compatiblePageSize],
    ([optionsList, nextPageSize]) => {
      if (optionsList.includes(pageSize.value)) return
      if (nextPageSize === pageSize.value) return
      setPageSize(nextPageSize)
    },
    { immediate: true },
  )

  return {
    rowCount,
    currentPage,
    pageSize,
    totalPages,
    canPreviousPage,
    canNextPage,
    state,
    pageSizeOptions,
    setPage,
    setPageSize,
    next,
    previous,
    reset,
  }
}
