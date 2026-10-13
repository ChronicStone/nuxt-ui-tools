<script setup lang="ts">
import { useVirtualizer } from '@tanstack/vue-virtual'
import { useElementSize } from '@vueuse/core'
import { computed, nextTick, useTemplateRef, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import { useTableRowLabels } from '../../composables/use-table-row-labels'
import {
  TABLE_SUMMARY_LOAD_MORE_THRESHOLD,
  TABLE_SUMMARY_SIZE_TOKENS,
  TABLE_SUMMARY_SKELETON_MIN_ROWS,
  TABLE_SUMMARY_SLOT_CLASSES,
  TABLE_SUMMARY_VIRTUALIZE_THRESHOLD,
} from '../../constants/summary'
import type { DataListControlSize, DataListSummaryUi, GenericObject } from '../../types'
import { mergeDataListUiClass } from '../../utils'
import { ROW_ACTIONS_COLUMN_ID } from '../../utils/columns/types'
import DataListErrorState from '../data-list/data-list-error-state.vue'
import ProgressLine from '../layout/progress-line.vue'
import TableEmptyState from '../table/table-empty-state.vue'
import TableSelectionControl from '../table/table-selection-control.vue'
import SummaryRow from './summary-row.vue'

/**
 * The table layout read as one compact row per record, the way a phone screen needs it. It takes
 * the table renderer's place while `table.summary` is active and keeps its states: first-load
 * placeholders, error, empty, refreshing, cursor pages and a virtualized window for long lists.
 */
const props = defineProps<{
  height?: string
  size?: DataListControlSize
  fill?: boolean
  ui?: DataListSummaryUi
}>()

const internals = useTableInternals()
const { selection } = internals
const { status } = internals.queryContent
const dataListUi = useDataListUi()
const labels = useTableRowLabels()
const { t } = useUiToolsLocale()

const rows = computed<GenericObject[]>(() =>
  internals.queryContent.error.value ? [] : internals.queryContent.data.value.rows,
)
const isFirstLoad = computed(
  () =>
    status.value.isBooting ||
    ((status.value.isPending || status.value.isFetching) && rows.value.length === 0),
)
const refreshing = computed(
  () =>
    rows.value.length > 0 &&
    (status.value.isFetching || status.value.isRefreshing || status.value.isRevalidating),
)
const replacing = computed(() => rows.value.length > 0 && status.value.isReplacing)
const error = computed(() => (rows.value.length === 0 ? internals.queryContent.error.value : null))
const empty = computed(() => !isFirstLoad.value && !error.value && rows.value.length === 0)
const scrolls = computed(() => Boolean(props.fill || props.height))

const resolvedSize = computed(
  () => props.size ?? dataListUi.ui.value.table?.size ?? dataListUi.controlSize.value,
)
const tokens = computed(() => TABLE_SUMMARY_SIZE_TOKENS[resolvedSize.value])
const tokenStyle = computed(() => ({
  '--nut-dl-summary-font': `${tokens.value.font}px`,
  '--nut-dl-summary-meta': `${tokens.value.font - 1}px`,
  '--nut-dl-summary-row-h': `${tokens.value.row}px`,
  '--nut-dl-summary-tile': `${tokens.value.tile}px`,
  '--nut-dl-summary-x': `${dataListUi.ui.value.table?.gutter ?? tokens.value.gutter}px`,
}))

/** Row actions are drawn when any row of the page has some, as in the table's last column. */
const hasActions = computed(() =>
  internals.tableColumns.runtimeColumns.value.some((column) => column.id === ROW_ACTIONS_COLUMN_ID),
)
const selectAllState = computed<boolean | 'indeterminate'>(
  () => selection.allSelected.value || (selection.partiallySelected.value && 'indeterminate'),
)

function css(slot: keyof DataListSummaryUi, extra = '') {
  return mergeDataListUiClass(
    `${TABLE_SUMMARY_SLOT_CLASSES[slot]} ${extra}`,
    undefined,
    props.ui?.[slot],
  )
}
function rowIdAt(index: number) {
  const row = rows.value[index]
  return row ? selection.getRowId({ index, row }) : String(index)
}
function refresh() {
  void internals.queryContent.refreshData()()
}
function toggleAll() {
  selection.toggleAllRows({ selected: !selection.allSelected.value })
}
function onSelectRow(rowId: string, event: MouseEvent) {
  selection.toggleRowSelection({
    rowId,
    selected: !selection.isRowSelected({ rowId }),
    shiftKey: event.shiftKey,
  })
}
/** Placeholder titles differ in length so a loading list does not read as a block. */
function skeletonTitleWidth(seed: number) {
  return 45 + ((seed * 37) % 40)
}

const scrollRef = useTemplateRef<HTMLElement>('scrollRef')
const { height: viewportHeight } = useElementSize(scrollRef)
const skeletonCount = computed(() =>
  Math.max(TABLE_SUMMARY_SKELETON_MIN_ROWS, Math.ceil(viewportHeight.value / tokens.value.row)),
)

const virtualized = computed(() => rows.value.length >= TABLE_SUMMARY_VIRTUALIZE_THRESHOLD)
const rowVirtualizer = useVirtualizer(
  computed(() => ({
    count: virtualized.value ? rows.value.length : 0,
    estimateSize: () => tokens.value.row,
    getItemKey: (index: number) => rowIdAt(index),
    getScrollElement: () => scrollRef.value ?? null,
    measureElement: (element: Element) => element.getBoundingClientRect().height,
    overscan: 12,
  })),
)
const virtualRows = computed(() =>
  virtualized.value ? rowVirtualizer.value.getVirtualItems() : [],
)
const paddingTop = computed(() => virtualRows.value[0]?.start ?? 0)
const paddingBottom = computed(() =>
  virtualRows.value.length
    ? rowVirtualizer.value.getTotalSize() - (virtualRows.value.at(-1)?.end ?? 0)
    : 0,
)
const renderedRows = computed(() =>
  virtualized.value
    ? virtualRows.value.flatMap((item) => {
        const row = rows.value[item.index]
        return row ? [{ index: item.index, row, rowId: rowIdAt(item.index) }] : []
      })
    : rows.value.map((row, index) => ({ index, row, rowId: rowIdAt(index) })),
)

function measureRow(target: Element | ComponentPublicInstance | null) {
  const element = target instanceof Element ? target : target?.$el
  if (!(element instanceof HTMLElement)) return
  if (element.isConnected) rowVirtualizer.value.measureElement(element)
  else nextTick().then(() => element.isConnected && rowVirtualizer.value.measureElement(element))
}

const cursorMode = computed(() => internals.pagination.mode.value === 'cursor')
const loadingMore = computed(
  () => cursorMode.value && internals.pagination.state.value.isLoadingMore,
)
const hasNextPage = computed(() => cursorMode.value && internals.pagination.state.value.hasNextPage)
watch(
  () =>
    [
      virtualRows.value.at(-1)?.index ?? rows.value.length - 1,
      rows.value.length,
      hasNextPage.value,
      loadingMore.value,
    ] as const,
  ([lastIndex, count, more, loading]) => {
    if (!more || loading || !count) return
    const threshold = Math.max(TABLE_SUMMARY_LOAD_MORE_THRESHOLD, virtualRows.value.length)
    if (lastIndex >= count - 1 - threshold) void internals.pagination.loadMore()
  },
)

/** A new page, sort, filter or search starts at the top once its rows arrive. */
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
  scrollRef.value?.scrollTo({ top: 0 })
}
watch(rows, resetScroll)
watch(
  () => status.value.isFetching,
  (fetching) => !fetching && resetScroll(),
)
</script>

<template>
  <div
    :class="
      mergeDataListUiClass(
        `${TABLE_SUMMARY_SLOT_CLASSES.root} ${fill ? 'h-full' : ''}`,
        undefined,
        ui?.root,
      )
    "
    :style="{ ...tokenStyle, height: !fill && height ? height : undefined }"
    :data-size="resolvedSize"
    :data-virtualized="virtualized"
    :data-loading="isFirstLoad"
    :data-replacing="replacing"
  >
    <div v-if="selection.selectionEnabled.value && rows.length > 0" :class="css('header')">
      <TableSelectionControl
        class="min-h-11 min-w-11 justify-center"
        :model-value="selectAllState"
        @toggle="toggleAll"
      />
      <span>{{ labels.selectAll() }}</span>
    </div>

    <div ref="scrollRef" :class="css('viewport', scrolls ? 'flex flex-1 flex-col' : '')">
      <div
        v-if="error"
        class="nut-dl-summary__state flex w-full flex-col"
        :class="scrolls ? 'min-h-0 flex-1' : ''"
      >
        <slot name="error" :error="error" :retry="refresh">
          <DataListErrorState
            :min-height="scrolls ? undefined : '16rem'"
            :size="resolvedSize"
            class="flex-1"
            @retry="refresh"
          />
        </slot>
      </div>
      <div
        v-else-if="empty"
        class="nut-dl-summary__state flex w-full flex-col"
        :class="scrolls ? 'min-h-0 flex-1' : ''"
      >
        <slot name="empty">
          <TableEmptyState
            :min-height="scrolls ? undefined : '16rem'"
            :size="resolvedSize"
            class="flex-1"
          />
        </slot>
      </div>
      <ul v-else role="list" :class="css('list')">
        <li
          v-for="placeholder in isFirstLoad ? skeletonCount : 0"
          :key="`skeleton-${placeholder}`"
          :class="css('skeleton')"
          aria-hidden="true"
        >
          <span
            class="nut-dl-skeleton size-[var(--nut-dl-summary-tile)] shrink-0 rounded-lg"
            :style="{ '--nut-dl-i': placeholder }"
          />
          <span class="min-w-0 flex-1">
            <span
              class="nut-dl-skeleton block h-3 rounded-full"
              :style="{ '--nut-dl-i': placeholder, width: `${skeletonTitleWidth(placeholder)}%` }"
            />
            <span
              class="nut-dl-skeleton mt-2 block h-2.5 w-1/3 rounded-full"
              :style="{ '--nut-dl-i': placeholder }"
            />
          </span>
        </li>

        <li v-if="paddingTop" :style="{ height: `${paddingTop}px` }" aria-hidden="true" />
        <SummaryRow
          v-for="entry in renderedRows"
          :key="entry.rowId"
          :ref="measureRow"
          :row-id="entry.rowId"
          :original="entry.row"
          :index="entry.index"
          :selected="selection.isRowSelected({ rowId: entry.rowId })"
          :selectable="selection.selectionEnabled.value"
          :actions="hasActions"
          :ui="ui"
          @select="onSelectRow(entry.rowId, $event)"
        />
        <li v-if="paddingBottom" :style="{ height: `${paddingBottom}px` }" aria-hidden="true" />

        <li v-if="loadingMore" :class="css('loadingMore')" aria-hidden="true">
          <span
            class="nut-dl-spinner size-3.5 rounded-full border-2 border-accented border-t-primary"
          />
          <span>{{ t('table.controls.loadingMore') }}</span>
        </li>
      </ul>
    </div>

    <ProgressLine
      :active="refreshing"
      :restart-key="internals.queryContent.refreshes.value"
      class="absolute inset-x-0 top-0 z-[6]"
    />
  </div>
</template>

<style>
.nut-dl-summary__list {
  transition: opacity 0.16s ease-out;
}
.nut-dl-summary[data-replacing='true'] .nut-dl-summary__list {
  opacity: 0.55;
  transition: opacity 0.2s ease-in 0.18s;
}
.nut-dl-summary__row {
  transition: background-color 0.1s;
}
.nut-dl-summary__row[data-interactive='true']:active {
  background: var(--nut-dl-summary-row-pressed, var(--ui-bg-muted));
}
@media (hover: hover) {
  .nut-dl-summary__row[data-interactive='true']:hover {
    background: var(--nut-dl-summary-row-hover, var(--ui-bg-elevated));
  }
}
.nut-dl-summary__row[data-selected='true'],
.nut-dl-summary__row[data-selected='true']:hover {
  background: var(
    --nut-dl-summary-row-selected,
    color-mix(in srgb, var(--ui-primary) 10%, var(--ui-bg))
  );
}
.nut-dl-summary__skeleton {
  animation: nut-dl-summary-in 0.18s ease 0.12s both;
}
@keyframes nut-dl-summary-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .nut-dl-summary__list,
  .nut-dl-summary__row {
    transition: none;
  }
  .nut-dl-summary__skeleton {
    animation: none;
  }
}
</style>
