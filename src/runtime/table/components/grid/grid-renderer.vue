<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { computed, nextTick, useTemplateRef, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import { GRID_DEFAULTS } from '../../constants/grid'
import type { DataListControlSize, DataListGridUi } from '../../types'
import { mergeDataListUiClass, resolveTableRowId } from '../../utils'
import DataListErrorState from '../data-list/data-list-error-state.vue'
import ProgressLine from '../layout/progress-line.vue'
import TableEmptyState from '../table/table-empty-state.vue'
import GridCard from './grid-card.vue'
import GridSkeleton from './grid-skeleton.vue'

const props = defineProps<{
  height?: string
  size?: DataListControlSize
  fill?: boolean
  ui?: DataListGridUi
}>()

const internals = useTableInternals()
const dataListUi = useDataListUi()
const { t } = useUiToolsLocale()
const resolvedSize = computed(
  () => props.size ?? dataListUi.ui.value.grid?.size ?? dataListUi.controlSize.value,
)
const gap = computed(() => dataListUi.ui.value.grid?.gap ?? 16)
const viewportRef = useTemplateRef<HTMLElement>('viewportRef')

const isContained = computed(() => internals.grid.mode.value === 'contained')
const rowChunks = computed(() => internals.grid.rowChunks.value)
const tableRows = computed(() => internals.grid.rows.value)
const status = computed(() => internals.queryContent.status.value)
const gridTemplateColumns = computed(
  () => `repeat(${internals.grid.columnCount.value}, minmax(0, 1fr))`,
)
const gridColumn = computed(
  () => `span ${internals.grid.itemColumnSpan.value} / span ${internals.grid.itemColumnSpan.value}`,
)
const showInitialLoading = computed(
  () => status.value.isBooting || (status.value.isPending && tableRows.value.length === 0),
)
const showRefreshing = computed(
  () =>
    !internals.queryContent.error.value &&
    tableRows.value.length > 0 &&
    (status.value.isFetching || status.value.isRefreshing || status.value.isRevalidating),
)
const replacing = computed(() => tableRows.value.length > 0 && status.value.isReplacing)
const showError = computed(() => Boolean(internals.queryContent.error.value))
const showEmpty = computed(
  () => !showInitialLoading.value && !showError.value && tableRows.value.length === 0,
)
const skeletonRows = computed(() =>
  Array.from({ length: GRID_DEFAULTS.skeletonRows }, (_, index) => index),
)

const rowVirtualizer = useVirtualizer(
  computed(() => ({
    count: isContained.value ? rowChunks.value.length : 0,
    estimateSize: () => GRID_DEFAULTS.estimatedRowHeight,
    gap: gap.value,
    getItemKey: (index: number) => getVirtualRowKey(index),
    getScrollElement: () => viewportRef.value ?? null,
    measureElement: (element: Element) => element.getBoundingClientRect().height,
    overscan: GRID_DEFAULTS.overscan,
  })),
)
const virtualRows = computed(() => rowVirtualizer.value.getVirtualItems())
const totalSize = computed(() => rowVirtualizer.value.getTotalSize())

watch(
  () => internals.controls.tableLayout.value,
  (layout) => {
    if (layout === 'grid') {
      scrollToTop()
    }
  },
)

function getVirtualRowKey(index: number) {
  const chunk = rowChunks.value[index]
  const firstRow = chunk?.rows[0]
  return firstRow
    ? `grid-row:${resolveTableRowId({ index: chunk.start, row: firstRow, rowKey: internals.schema.value.rowKey })}`
    : `grid-row:${index}`
}

function rowId(row: object, index: number) {
  return resolveTableRowId({ index, row, rowKey: internals.schema.value.rowKey })
}

function scrollToTop() {
  viewportRef.value?.scrollTo({ behavior: 'auto', left: 0, top: 0 })
}

function measureVirtualRow(element: Element | ComponentPublicInstance | null) {
  const resolved = element instanceof Element ? element : (element?.$el as Element | undefined)
  if (!(resolved instanceof HTMLElement)) {
    return
  }
  if (resolved.isConnected) {
    rowVirtualizer.value.measureElement(resolved)
  } else {
    nextTick().then(() => {
      if (resolved.isConnected) {
        rowVirtualizer.value.measureElement(resolved)
      }
    })
  }
}

const cursorMode = computed(() => internals.pagination.mode.value === 'cursor')
const loadingMore = computed(
  () => cursorMode.value && internals.pagination.state.value.isLoadingMore,
)
const hasNextPage = computed(() => cursorMode.value && internals.pagination.state.value.hasNextPage)
let scrollResetPending = false
watch(
  () => [
    internals.pagination.currentPage.value,
    internals.pagination.pageSize.value,
    JSON.stringify(internals.tableColumns.sortingState.value),
    JSON.stringify(internals.queryState.filters.value),
    internals.filters.searchQuery.value,
  ],
  () => {
    if (!cursorMode.value) scrollResetPending = true
  },
)
function resetScroll() {
  if (!scrollResetPending) return
  scrollResetPending = false
  scrollToTop()
}
watch(tableRows, resetScroll)
watch(
  () => status.value.isFetching,
  (fetching) => !fetching && resetScroll(),
)
watch(
  () =>
    [
      virtualRows.value.at(-1)?.index ?? -1,
      rowChunks.value.length,
      hasNextPage.value,
      loadingMore.value,
    ] as const,
  ([lastIndex, count, more, loading]) => {
    if (!isContained.value || !more || loading || !count) {
      return
    }
    if (lastIndex >= count - 2) {
      void internals.pagination.loadMore()
    }
  },
)
function onScrollLoadMore() {
  if (!hasNextPage.value || loadingMore.value || isContained.value) {
    return
  }
  const element = viewportRef.value
  if (!element) {
    return
  }
  if (element.scrollHeight - element.scrollTop - element.clientHeight < 400) {
    void internals.pagination.loadMore()
  }
}

function refreshData() {
  void internals.queryContent.refreshData()
}
</script>

<template>
  <div
    :class="
      mergeDataListUiClass(
        `nut-dl-grid relative ${fill ? 'flex h-full min-h-0 flex-col' : ''}`,
        undefined,
        ui?.root,
      )
    "
    :style="{ '--nut-dl-grid-gap': `${gap}px`, height: !fill && height ? height : undefined }"
    :data-loading="showInitialLoading"
    :data-replacing="replacing"
  >
    <div
      ref="viewportRef"
      :class="
        mergeDataListUiClass(
          `nut-dl-grid__viewport relative ${fill || height ? 'min-h-0 flex-1 overflow-auto' : ''}`,
          undefined,
          ui?.viewport,
        )
      "
      @scroll.passive="onScrollLoadMore"
    >
      <div
        v-if="showInitialLoading"
        :class="mergeDataListUiClass('nut-dl-grid__flow grid', undefined, ui?.loading)"
        :style="{ gridTemplateColumns, gap: `${gap}px` }"
      >
        <div
          v-for="row in skeletonRows"
          :key="row"
          :style="{ gridColumn, '--nut-dl-i': row }"
          class="nut-dl-grid__skeleton"
        >
          <GridSkeleton />
        </div>
      </div>

      <div
        v-else-if="showError"
        :class="
          mergeDataListUiClass(
            'nut-dl-grid__state flex h-full flex-col items-stretch justify-center',
            undefined,
            ui?.error,
          )
        "
      >
        <slot name="error" :error="internals.queryContent.error.value" :retry="refreshData">
          <DataListErrorState
            :min-height="fill ? undefined : '16rem'"
            :size="resolvedSize"
            class="flex-1"
            @retry="refreshData"
          />
        </slot>
      </div>

      <div
        v-else-if="showEmpty"
        :class="
          mergeDataListUiClass(
            'nut-dl-grid__state flex h-full items-center justify-center',
            undefined,
            ui?.empty,
          )
        "
      >
        <slot name="empty">
          <TableEmptyState :min-height="fill ? undefined : '24rem'" :size="resolvedSize" />
        </slot>
      </div>

      <div
        v-else-if="isContained"
        :class="mergeDataListUiClass('nut-dl-grid__canvas relative w-full', undefined, ui?.canvas)"
        :style="{ height: `${totalSize}px` }"
        :data-loading-more="loadingMore"
      >
        <div
          v-for="virtualRow in virtualRows"
          :key="String(virtualRow.key)"
          :ref="measureVirtualRow"
          :class="
            mergeDataListUiClass(
              'nut-dl-grid__row absolute inset-x-0 top-0 grid',
              undefined,
              ui?.row,
            )
          "
          :style="{
            transform: `translateY(${virtualRow.start}px)`,
            gridTemplateColumns,
            gap: `${gap}px`,
          }"
          :data-index="virtualRow.index"
        >
          <div
            v-for="(row, offset) in rowChunks[virtualRow.index]?.rows ?? []"
            :key="rowId(row, (rowChunks[virtualRow.index]?.start ?? 0) + offset)"
            :class="mergeDataListUiClass('nut-dl-grid__item min-w-0', undefined, ui?.item)"
            :style="{ gridColumn }"
            :data-row-id="rowId(row, (rowChunks[virtualRow.index]?.start ?? 0) + offset)"
          >
            <GridCard :row-index="(rowChunks[virtualRow.index]?.start ?? 0) + offset" />
          </div>
        </div>
      </div>

      <div
        v-else
        :class="mergeDataListUiClass('nut-dl-grid__flow grid', undefined, ui?.flow)"
        :style="{ gridTemplateColumns, gap: `${gap}px` }"
      >
        <div
          v-for="(row, index) in tableRows"
          :key="rowId(row, index)"
          :class="mergeDataListUiClass('nut-dl-grid__item min-w-0', undefined, ui?.item)"
          :style="{ gridColumn }"
        >
          <GridCard :row-index="index" />
        </div>
      </div>
    </div>

    <div
      v-if="loadingMore"
      class="nut-dl-grid__more flex items-center justify-center gap-2.5 py-3 text-[12.5px] text-muted"
      aria-hidden="true"
    >
      <span
        class="nut-dl-spinner size-3.5 rounded-full border-2 border-accented border-t-primary"
      />
      <span>{{ t('table.controls.loadingMore') }}</span>
    </div>

    <ProgressLine
      :active="showRefreshing"
      :restart-key="internals.queryContent.refreshes.value"
      :class="
        mergeDataListUiClass(
          'nut-dl-grid__progress absolute inset-x-0 top-0 z-10',
          undefined,
          ui?.refreshing,
        )
      "
      :bar-class="mergeDataListUiClass('nut-dl-grid__progress-bar', undefined, ui?.refreshingLine)"
    />
  </div>
</template>

<style>
.nut-dl-grid__skeleton {
  animation: nut-dl-grid-in 0.18s ease 0.12s both;
}
.nut-dl-grid__viewport {
  scrollbar-width: thin;
  overflow-anchor: none;
}
.nut-dl-grid__flow,
.nut-dl-grid__canvas {
  transition: opacity 0.16s ease-out;
}
.nut-dl-grid[data-replacing='true'] .nut-dl-grid__flow,
.nut-dl-grid[data-replacing='true'] .nut-dl-grid__canvas {
  opacity: 0.55;
  transition: opacity 0.2s ease-in 0.18s;
}
@keyframes nut-dl-grid-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .nut-dl-grid__skeleton {
    animation: none;
  }
  .nut-dl-grid__flow,
  .nut-dl-grid__canvas {
    transition: none;
  }
}
</style>
