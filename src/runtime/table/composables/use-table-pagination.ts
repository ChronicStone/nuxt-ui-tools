import { computed, ref, watch, type ComputedRef } from 'vue'

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
  const stableRemoteRowCount = ref<number | null>(0)
  const mode = computed(() => options.state.queryState.pagination.value.mode)
  const loadedCount = computed(() => options.queryContent.data.value.rows.length)
  const rowCount = computed<number | null>(() =>
    options.schema.value.source.mode === 'remote'
      ? stableRemoteRowCount.value
      : options.queryContent.data.value.rowCount,
  )
  const currentPage = computed(() => {
    const pagination = options.state.queryState.pagination.value
    return pagination.mode === 'offset' ? pagination.pageIndex : 1
  })
  const pageSize = computed(() => {
    const pagination = options.state.queryState.pagination.value
    if (pagination.mode === 'none') return Math.max(1, loadedCount.value)
    return pagination.pageSize
  })
  const totalPages = computed(() =>
    Math.max(1, Math.ceil((rowCount.value ?? loadedCount.value) / Math.max(1, pageSize.value))),
  )
  const canPreviousPage = computed(() => mode.value === 'offset' && currentPage.value > 1)
  const canNextPage = computed(() => {
    if (mode.value === 'cursor') return infiniteHasNextPage.value
    if (mode.value === 'none') return false
    return currentPage.value < totalPages.value
  })
  const infiniteHasNextPage = computed(() => options.queryContent.infiniteQuery.hasNextPage.value)
  const isLoadingMore = computed(() => options.queryContent.infiniteQuery.isFetchingNextPage.value)
  const loadMoreError = computed(() =>
    options.queryContent.infiniteQuery.isFetchNextPageError.value
      ? options.queryContent.infiniteQuery.error.value
      : null,
  )
  const state = computed(() => ({
    mode: mode.value,
    pageIndex: currentPage.value,
    pageSize: pageSize.value,
    pageCount: totalPages.value,
    loadedCount: loadedCount.value,
    totalCount: rowCount.value,
    hasNextPage: canNextPage.value,
    hasPreviousPage: canPreviousPage.value,
    isLoadingMore: isLoadingMore.value,
    loadMoreError: loadMoreError.value,
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
    if (mode.value !== 'offset') return
    options.state.queryState.setOffsetPagination({
      pageIndex: Math.max(1, Math.min(page, totalPages.value)),
      pageSize: pageSize.value,
    })
  }

  function setPageSize(nextPageSize: number) {
    if (mode.value !== 'offset') return
    options.state.queryState.setOffsetPagination({ pageIndex: 1, pageSize: nextPageSize })
  }

  function next() {
    setPage(currentPage.value + 1)
  }

  function previous() {
    setPage(currentPage.value - 1)
  }

  function reset() {
    options.state.queryState.resetPagination()
  }

  async function loadMore() {
    if (mode.value !== 'cursor' || !infiniteHasNextPage.value || isLoadingMore.value) return
    return options.queryContent.infiniteQuery.fetchNextPage()
  }

  watch(
    [pageSizeOptions, compatiblePageSize],
    ([optionsList, nextPageSize]) => {
      if (mode.value !== 'offset') return
      if (optionsList.includes(pageSize.value)) return
      if (nextPageSize === pageSize.value) return

      setPageSize(nextPageSize)
    },
    { immediate: true },
  )

  watch(
    [
      () => options.queryContent.data.value.rowCount,
      () => options.queryContent.status.value.isDataFetching,
    ],
    ([nextRowCount, isFetching]) => {
      if (options.schema.value.source.mode !== 'remote') {
        stableRemoteRowCount.value = nextRowCount
        return
      }

      if (isFetching) return
      stableRemoteRowCount.value = nextRowCount
    },
    { immediate: true },
  )

  return {
    mode,
    rowCount,
    loadedCount,
    currentPage,
    pageSize,
    totalPages,
    canPreviousPage,
    canNextPage,
    isLoadingMore,
    loadMoreError,
    state,
    pageSizeOptions,
    setPage,
    setPageSize,
    next,
    previous,
    reset,
    loadMore,
  }
}
