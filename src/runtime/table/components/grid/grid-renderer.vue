<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import { GRID_DEFAULTS } from '../../constants/grid'
import type { DataListControlSize, DataListGridUi } from '../../types'
import { mergeDataListUiClass, resolveTableRowId } from '../../utils'
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
const animationsReady = ref<boolean>(false)

const isContained = computed(() => internals.grid.mode.value === 'contained')
const rowChunks = computed(() => internals.grid.rowChunks.value)
const tableRows = computed(() => internals.grid.rows.value)
const flipPositions = new Map<string, { left: number; top: number }>()
watch(
  tableRows,
  () => {
    flipPositions.clear()
    if (!isContained.value) {
      return
    }
    const items =
      viewportRef.value?.querySelectorAll<HTMLElement>('.nut-dl-grid__item[data-row-id]') ?? []
    for (const item of items) {
      const rect = item.getBoundingClientRect()
      flipPositions.set(item.dataset.rowId ?? '', { left: rect.left, top: rect.top })
    }
  },
  { flush: 'pre' },
)
watch(tableRows, () => nextTick(flipCards), { flush: 'post' })
function flipCards() {
  if (!flipPositions.size) {
    return
  }
  const items =
    viewportRef.value?.querySelectorAll<HTMLElement>('.nut-dl-grid__item[data-row-id]') ?? []
  for (const item of items) {
    const previous = flipPositions.get(item.dataset.rowId ?? '')
    if (!previous) {
      continue
    }
    const rect = item.getBoundingClientRect()
    const dx = previous.left - rect.left
    const dy = previous.top - rect.top
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      item.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
        duration: 240,
        easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)',
      })
    }
  }
  flipPositions.clear()
}
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
    tableRows.value.length > 0 &&
    (status.value.isFetching || status.value.isRefreshing || status.value.isRevalidating),
)
const showError = computed(
  () => Boolean(internals.queryContent.error.value) && tableRows.value.length === 0,
)
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

onMounted(() => {
  nextTick().then(() => {
    animationsReady.value = true
  })
})

watch(
  () => internals.pagination.currentPage.value,
  () => scrollToTop(),
)
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
    nextTick(() => {
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
    :data-animated="animationsReady"
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
            'nut-dl-grid__state flex items-center justify-center px-4 py-10',
            undefined,
            ui?.error,
          )
        "
      >
        <div
          :class="
            mergeDataListUiClass(
              'grid max-w-md justify-items-center gap-3 rounded-lg border border-default bg-default px-6 py-8 text-center',
              undefined,
              ui?.errorCard,
            )
          "
        >
          <UIcon
            name="i-lucide-cloud-alert"
            :class="mergeDataListUiClass('size-5 text-error', undefined, ui?.errorIcon)"
          />
          <div :class="mergeDataListUiClass('grid gap-1', undefined, ui?.errorCopy)">
            <div
              :class="
                mergeDataListUiClass('font-medium text-highlighted', undefined, ui?.errorTitle)
              "
            >
              {{ t('table.states.gridError.title') }}
            </div>
            <p :class="mergeDataListUiClass('text-sm text-muted', undefined, ui?.errorDescription)">
              {{ t('table.states.gridError.description') }}
            </p>
          </div>
          <UButton
            color="neutral"
            variant="outline"
            :size="resolvedSize"
            icon="i-lucide-refresh-cw"
            :ui="{ base: ui?.retry }"
            @click="refreshData"
          >
            {{ t('table.states.gridError.action') }}
          </UButton>
        </div>
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
          <TableEmptyState min-height="24rem" :size="resolvedSize" />
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

      <TransitionGroup
        v-else
        tag="div"
        :class="mergeDataListUiClass('nut-dl-grid__flow grid', undefined, ui?.flow)"
        :style="{ gridTemplateColumns, gap: `${gap}px` }"
        move-class="nut-dl-grid__item--moving"
        enter-active-class="nut-dl-grid__item--entering"
        enter-from-class="nut-dl-grid__item--from"
        leave-active-class="nut-dl-grid__item--leaving"
        leave-to-class="nut-dl-grid__item--from"
      >
        <div
          v-for="(row, index) in tableRows"
          :key="rowId(row, index)"
          :class="mergeDataListUiClass('nut-dl-grid__item min-w-0', undefined, ui?.item)"
          :style="{ gridColumn }"
        >
          <GridCard :row-index="index" />
        </div>
      </TransitionGroup>
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

    <Transition name="nut-dl-grid-progress">
      <div
        v-if="showRefreshing"
        :class="
          mergeDataListUiClass(
            'nut-dl-grid__progress pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden',
            undefined,
            ui?.refreshing,
          )
        "
        aria-hidden="true"
      >
        <span
          :class="
            mergeDataListUiClass(
              'nut-dl-grid__progress-bar block h-full w-full',
              undefined,
              ui?.refreshingLine,
            )
          "
        />
      </div>
    </Transition>
  </div>
</template>

<style>
.nut-dl-grid__skeleton {
  animation: nut-dl-grid-in 0.2s ease both;
  animation-delay: calc(var(--nut-dl-i, 0) * 30ms);
}
.nut-dl-grid__viewport {
  scrollbar-width: thin;
  overflow-anchor: none;
}
.nut-dl-grid[data-animated='true'] .nut-dl-grid__item {
  animation: nut-dl-grid-in 0.22s cubic-bezier(0.2, 0.9, 0.3, 1) both;
}
.nut-dl-grid__item--moving {
  transition: transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1);
}
.nut-dl-grid__item--entering {
  transition:
    opacity 0.18s ease,
    transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1);
}
.nut-dl-grid__item--leaving {
  position: absolute;
  transition:
    opacity 0.14s ease,
    transform 0.14s ease;
}
.nut-dl-grid__item--from {
  opacity: 0;
  transform: translateY(6px);
}
@keyframes nut-dl-grid-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.nut-dl-grid__progress-bar {
  background: linear-gradient(90deg, transparent, var(--ui-primary), transparent);
  background-size: 40% 100%;
  animation: nut-dl-grid-progress 1s ease-in-out infinite;
}
@keyframes nut-dl-grid-progress {
  from {
    background-position: -40% 0;
  }
  to {
    background-position: 140% 0;
  }
}
.nut-dl-grid-progress-enter-active,
.nut-dl-grid-progress-leave-active {
  transition: opacity 0.16s ease;
}
.nut-dl-grid-progress-enter-from,
.nut-dl-grid-progress-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .nut-dl-grid[data-animated='true'] .nut-dl-grid__item,
  .nut-dl-grid__progress-bar {
    animation: none;
  }
  .nut-dl-grid__item--moving,
  .nut-dl-grid__item--entering,
  .nut-dl-grid__item--leaving {
    transition: none;
  }
}
</style>
