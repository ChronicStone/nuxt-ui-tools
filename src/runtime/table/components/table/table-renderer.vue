<script setup lang="ts">
import { useVirtualizer } from '@tanstack/vue-virtual'
import type { Virtualizer } from '@tanstack/vue-virtual'
import { computed, h, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { isFunction, isNumber, isObject } from '../../../shared/utils/predicate'
import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import { useTanstackTable } from '../../composables/use-tanstack-table'
import type {
  DataListControlSize,
  DataListTableUi,
  GenericObject,
  TableColumnSummary,
  TableColumnSummaryConfig,
  TableSummaryValue,
} from '../../types'
import { mergeDataListUiClass } from '../../utils'
import {
  ROW_ACTIONS_COLUMN_ID,
  SELECT_COLUMN_ID,
  SELECT_COLUMN_WIDTH,
} from '../../utils/columns/types'
import DataListErrorState from '../data-list/data-list-error-state.vue'
import ProgressLine from '../layout/progress-line.vue'
import TableCell from './table-cell'
import TableColumnHeader from './table-column-header.vue'
import TableEmptyState from './table-empty-state.vue'
import { columnCellLayout, tableRowCells } from './table-layout'
import type { TableColumnSlot } from './table-layout'
import TableOverlayScrollbars from './table-overlay-scrollbars.vue'
import TableRow from './table-row.vue'
import TableSkeletonCell from './table-skeleton-cell'

const LOAD_MORE_THRESHOLD = 6
const PREFETCH_VIEWPORTS = 3
const VIRTUALIZE_ROW_THRESHOLD = 40
const VIRTUALIZE_CELL_THRESHOLD = 240
const VIRTUALIZE_COLUMN_THRESHOLD = 12
const APPEND_WINDOW = 400
const SKELETON_MIN_ROWS = 6

const SIZE_TOKENS = {
  lg: { font: 13.5, head: 46, row: 52, x: 16 },
  md: { font: 13, head: 42, row: 44, x: 14 },
  sm: { font: 12.5, head: 38, row: 36, x: 10 },
  xl: { font: 14, head: 48, row: 60, x: 16 },
  xs: { font: 12, head: 34, row: 32, x: 8 },
} satisfies Record<DataListControlSize, { row: number; head: number; x: number; font: number }>

const props = defineProps<{
  gutter?: number
  height?: string
  size?: DataListControlSize
  fill?: boolean
  ui?: DataListTableUi
}>()

const internals = useTableInternals()
const dataListUi = useDataListUi()
const { locale, t } = useUiToolsLocale()

const rows = computed<GenericObject[]>(() =>
  internals.queryContent.error.value ? [] : internals.queryContent.data.value.rows,
)
const { status } = internals.queryContent
const rowsMounted = ref(false)
let rowMountFrame = 0
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

function refresh() {
  void internals.queryContent.refreshData()()
}

const resolvedSize = computed(
  () => props.size ?? dataListUi.ui.value.table?.size ?? dataListUi.controlSize.value,
)
const tokens = computed(() => SIZE_TOKENS[resolvedSize.value])
const rowHeight = computed(() => tokens.value.row)
const gutter = computed(() => props.gutter ?? dataListUi.ui.value.table?.gutter ?? tokens.value.x)
const gutterExtra = computed(() => Math.max(0, gutter.value - tokens.value.x))
const tokenStyle = computed(() => ({
  '--nut-dl-cell-x': `${tokens.value.x}px`,
  '--nut-dl-font': `${tokens.value.font}px`,
  '--nut-dl-foot-h': `${tokens.value.head - 2}px`,
  '--nut-dl-gutter': `${gutter.value}px`,
  '--nut-dl-head-h': `${tokens.value.head}px`,
  '--nut-dl-row-h': `${tokens.value.row}px`,
}))

const { columnDefs } = internals.tableColumns
const columnState = internals.tableColumns.tableState
const columnSizing = computed({
  get: () => {
    const sizing = columnState.value.columnSizing ?? {}
    if (!gutterExtra.value) {
      return sizing
    }
    const ids = new Set(columnDefs.value.map((def) => def.id))
    const next = { ...sizing }
    if (ids.has(SELECT_COLUMN_ID) && !(SELECT_COLUMN_ID in sizing)) {
      next[SELECT_COLUMN_ID] = SELECT_COLUMN_WIDTH + gutterExtra.value
    }
    return next
  },
  set: (columnSizing: Record<string, number>) => {
    columnState.value = { ...columnState.value, columnSizing }
  },
})
const pinned = computed(() => {
  const ids = new Set(columnDefs.value.map((def) => def.id))
  const left = (columnState.value.columnPinning?.left ?? []).filter(
    (id) => ids.has(id) && id !== SELECT_COLUMN_ID,
  )
  const right = (columnState.value.columnPinning?.right ?? []).filter(
    (id) => ids.has(id) && id !== ROW_ACTIONS_COLUMN_ID,
  )
  return {
    end: ids.has(ROW_ACTIONS_COLUMN_ID) ? [...right, ROW_ACTIONS_COLUMN_ID] : right,
    start: ids.has(SELECT_COLUMN_ID) ? [SELECT_COLUMN_ID, ...left] : left,
  }
})

function getRowId(row: GenericObject, index: number) {
  return internals.selection.getRowId({ index, row })
}

const renderRows = computed(() => (rowsMounted.value ? rows.value : []))
const virtualized = computed(
  () =>
    renderRows.value.length >= VIRTUALIZE_ROW_THRESHOLD ||
    renderRows.value.length * columnDefs.value.length >= VIRTUALIZE_CELL_THRESHOLD,
)

const scrollRef = useTemplateRef<HTMLElement>('scrollRef')
const rowHeights = new Map<string, number>()
/**
 * Row heights come from the resize observer entries the virtualizer already receives, so mounting
 * a row never forces a synchronous layout. Until an entry arrives, a row keeps its last known
 * height or the density estimate, which is exact for every single-line row.
 */
function measureRowHeight(element: Element, entry: ResizeObserverEntry | undefined) {
  const key = element instanceof HTMLElement ? element.dataset.rowId : undefined
  const known = key === undefined ? undefined : rowHeights.get(key)
  const box = entry?.borderBoxSize?.[0]
  if (!box) {
    return known ?? rowHeight.value
  }
  const height = box.blockSize
  if (key === undefined) {
    return height
  }
  const next = Math.max(known ?? 0, height)
  rowHeights.set(key, next)
  return next
}
const rowVirtualizer = useVirtualizer(
  computed(() => ({
    count: virtualized.value ? renderRows.value.length : 0,
    estimateSize: () => rowHeight.value,
    getItemKey: (index: number) =>
      renderRows.value[index] ? getRowId(renderRows.value[index]!, index) : index,
    getScrollElement: () => scrollRef.value ?? null,
    measureElement: (element: Element, entry: ResizeObserverEntry | undefined) =>
      measureRowHeight(element, entry),
    overscan: 16,
  })),
)
const virtualRows = computed(() =>
  virtualized.value ? rowVirtualizer.value.getVirtualItems() : [],
)

const { table, resetColumnSizing } = useTanstackTable({
  columnSizing,
  columns: columnDefs,
  data: renderRows,
  getRowId,
  pinned,
})

const tableRows = computed(() => table.getRowModel().rows)
const leafColumns = computed(() => table.getVisibleLeafColumns())
const centerColumns = computed(() => table.getCenterVisibleLeafColumns())
const bodyWidth = ref(0)
const bodyHeight = ref(0)
const columnsOverflow = computed(
  () =>
    bodyWidth.value > 0 &&
    table.getTotalSize() > bodyWidth.value &&
    centerColumns.value.length > VIRTUALIZE_COLUMN_THRESHOLD,
)
const columnVirtualizer = useVirtualizer(
  computed(() => ({
    count: columnsOverflow.value ? centerColumns.value.length : 0,
    estimateSize: (index: number) => centerColumns.value[index]?.getSize() ?? 0,
    getItemKey: (index: number) => centerColumns.value[index]?.id ?? index,
    getScrollElement: () => scrollRef.value ?? null,
    horizontal: true,
    initialRect: { height: 0, width: bodyWidth.value },
    onChange: (instance: Virtualizer<HTMLElement, Element>) => {
      const width = instance.scrollRect?.width
      if (width && width !== bodyWidth.value) {
        bodyWidth.value = width
      }
    },
    overscan: 2,
    paddingEnd: table.getEndTotalSize(),
    paddingStart: table.getStartTotalSize(),
  })),
)
const virtualColumns = computed(() => columnVirtualizer.value.getVirtualItems())

type ColumnSlot = TableColumnSlot

const filled = computed(
  () => !columnsOverflow.value && bodyWidth.value > 0 && table.getTotalSize() < bodyWidth.value,
)
const tableCols = computed(() => {
  const cols: { key: string; width?: string }[] = leafColumns.value.map((leaf) => ({
    key: leaf.id,
    width: `${leaf.getSize()}px`,
  }))
  if (filled.value) {
    cols.splice(cols.length - table.getEndVisibleLeafColumns().length, 0, { key: 'fill' })
  }
  return cols
})
const columnCount = computed(() => tableCols.value.length)

const columnSlots = computed<ColumnSlot[]>(() => {
  function asSlot(column: { id: string }): ColumnSlot {
    return {
      columnId: column.id,
      key: column.id,
      kind: 'column',
    }
  }
  const slots: ColumnSlot[] = table.getStartVisibleLeafColumns().map(asSlot)
  if (!columnsOverflow.value) {
    slots.push(...centerColumns.value.map(asSlot))
    if (filled.value) {
      slots.push({ key: 'fill', kind: 'fill' })
    }
    slots.push(...table.getEndVisibleLeafColumns().map(asSlot))
    return slots
  }
  const first = virtualColumns.value[0]
  const last = virtualColumns.value.at(-1)
  if (first?.index) {
    slots.push({ colSpan: first.index, key: 'pad-start', kind: 'spacer' })
  }
  slots.push(
    ...virtualColumns.value.flatMap((item) => {
      const column = centerColumns.value[item.index]
      return column ? [asSlot(column)] : []
    }),
  )
  const trailing = last ? centerColumns.value.length - last.index - 1 : centerColumns.value.length
  if (trailing) {
    slots.push({ colSpan: trailing, key: 'pad-end', kind: 'spacer' })
  }
  slots.push(...table.getEndVisibleLeafColumns().map(asSlot))
  return slots
})

const headers = computed(() => table.getHeaderGroups()[0]?.headers ?? [])
const headerByColumnId = computed(() => new Map(headers.value.map((h) => [h.column.id, h])))
/**
 * Header props built once per state change: calling the menu and resize factories in the template
 * handed every header fresh arrays and functions on each render, so scrolling re-rendered all
 * headers and their menus.
 */
const headerCellProps = computed(
  () =>
    new Map(
      headers.value.map((header) => {
        const { column } = header
        const meta = column.columnDef.meta
        return [
          column.id,
          {
            align: meta?.align,
            icon: meta?.icon,
            items: internals.tableColumns.getMenuItems({ columnId: column.id }),
            label: meta?.label ?? '',
            pinned: Boolean(internals.tableColumns.getPinnedState({ columnId: column.id })),
            resetSize: () => column.resetSize(),
            resizable: column.getCanResize(),
            resize: header.getResizeHandler(),
            resizing: column.getIsResizing(),
            sortState: internals.tableColumns.getSortState({ columnId: column.id }),
            sortable: meta?.sortable,
          },
        ]
      }),
    ),
)
const HEADER_ROW = {}

const virtualPaddingTop = computed(() => virtualRows.value[0]?.start ?? 0)
const virtualPaddingBottom = computed(() => {
  if (!virtualized.value || !virtualRows.value.length) {
    return 0
  }
  return rowVirtualizer.value.getTotalSize() - (virtualRows.value.at(-1)?.end ?? 0)
})
const renderedRows = computed(() => {
  if (!virtualized.value) {
    return tableRows.value.map((row, index) => ({ row, virtual: { index, key: String(row.id) } }))
  }
  return virtualRows.value.flatMap((item) => {
    const row = tableRows.value[item.index]
    return row ? [{ row, virtual: { index: item.index, key: String(item.key) } }] : []
  })
})

const rowCells = computed(() =>
  tableRowCells({
    layouts: new Map(
      leafColumns.value.map((column) => [
        column.id,
        columnCellLayout({
          firstEnd: isFirstEnd(column),
          lastStart: isLastStart(column),
          meta: column.columnDef.meta,
          offset: pinnedOffset(column),
          pinned: column.getIsPinned(),
          tdClass: mergeDataListUiClass(undefined, undefined, props.ui?.td),
        }),
      ]),
    ),
    slots: columnSlots.value,
  }),
)
const rowClass = computed(() => mergeDataListUiClass(undefined, undefined, props.ui?.tr))

function measureRow(target: Element | ComponentPublicInstance | null) {
  const element = target instanceof Element ? target : target?.$el
  if (!(element instanceof HTMLElement)) {
    return
  }
  if (element.isConnected) {
    rowVirtualizer.value.measureElement(element)
  } else {
    nextTick().then(() => element.isConnected && rowVirtualizer.value.measureElement(element))
  }
}

const scrollbarsRef = useTemplateRef<{ measure: () => void }>('scrollbarsRef')
const totalWidth = computed(() => table.getTotalSize())
const skeletonRows = computed(() => {
  const usable = bodyHeight.value - tokens.value.head
  if (usable <= 0) {
    return SKELETON_MIN_ROWS
  }
  return Math.max(SKELETON_MIN_ROWS, Math.ceil(usable / rowHeight.value))
})

function measureBody() {
  bodyHeight.value = scrollRef.value?.clientHeight ?? 0
  bodyWidth.value = scrollRef.value?.clientWidth ?? 0
}

let resizeObserver: ResizeObserver | undefined
onMounted(() => {
  measureBody()
  if (scrollRef.value) {
    resizeObserver = new ResizeObserver(measureBody)
    resizeObserver.observe(scrollRef.value)
  }
  rowMountFrame = requestAnimationFrame(() => (rowsMounted.value = true))
})
onBeforeUnmount(() => {
  cancelAnimationFrame(rowMountFrame)
  resizeObserver?.disconnect()
})

watch([totalWidth, () => rows.value.length], () =>
  nextTick().then(() => {
    columnVirtualizer.value.measure()
    scrollbarsRef.value?.measure()
  }),
)
watch(
  () => internals.pagination.currentPage.value,
  () => scrollRef.value?.scrollTo({ top: 0 }),
)

const openMenuId = ref<string | null>(null)

function pinnedOffset(column: {
  getIsPinned: () => string | false
  getStart: (p: 'start') => number
  getAfter: (p: 'end') => number
}) {
  const side = column.getIsPinned()
  if (side === 'start') {
    return { left: `${column.getStart('start')}px` }
  }
  if (side === 'end') {
    return { right: `${column.getAfter('end')}px` }
  }
}

function isLastStart(column: { id: string }) {
  return table.getStartVisibleLeafColumns().at(-1)?.id === column.id
}
function isFirstEnd(column: { id: string }) {
  return table.getEndVisibleLeafColumns()[0]?.id === column.id
}

const { summaries } = internals
const summaryColumnIds = computed(() => new Set(summaries.columns.value.map((column) => column.id)))
const summaryLabelColumnId = computed(
  () =>
    leafColumns.value.find(
      (column) => !column.columnDef.meta?.internal && !summaryColumnIds.value.has(column.id),
    )?.id,
)
const summaryLabel = computed(() => {
  const label = summaries.label.value
  if (label) {
    return isFunction(label) ? String(label()) : String(label)
  }
  return summaries.scope.value === 'filtered'
    ? t('table.summaries.total')
    : t(`table.summaries.${summaries.scope.value}`)
})
const summaryUnit = computed(() =>
  t(summaries.count.value === 1 ? 'table.summaries.rowOne' : 'table.summaries.rowOther'),
)
function formatNumber(value: TableSummaryValue) {
  return isNumber(value)
    ? new Intl.NumberFormat(locale.value.code).format(value).replaceAll(' ', '\u00A0')
    : String(value ?? '')
}
function isSummaryConfig(
  summary: TableColumnSummary | undefined,
): summary is TableColumnSummaryConfig {
  return isObject(summary)
}
function renderSummary(columnId: string) {
  const column = summaries.columns.value.find((entry) => entry.id === columnId)
  const cell = summaries.cell(columnId)
  const summary = column?.summary
  const render = isSummaryConfig(summary) ? summary.render : undefined
  if (render) {
    return () => render({ loading: cell.loading, scope: summaries.scope.value, value: cell.value })
  }
  const value = summaries.format(columnId)
  return () => h('span', formatNumber(value))
}

const appendedFrom = ref<number>(Number.POSITIVE_INFINITY)
const scrollResetPending = ref<boolean>(false)
let appendTimer = 0
watch(
  () => [
    internals.pagination.currentPage.value,
    internals.pagination.pageSize.value,
    JSON.stringify(internals.tableColumns.sortingState.value),
    JSON.stringify(internals.queryState.filters.value),
    internals.filters.searchQuery.value,
  ],
  () => {
    if (!rowsMounted.value || cursorMode.value) return
    rowHeights.clear()
    scrollResetPending.value = true
  },
)
function resetScroll() {
  if (!scrollResetPending.value) return
  scrollResetPending.value = false
  scrollRef.value?.scrollTo({ top: 0 })
}
watch(rows, resetScroll)
watch(
  () => status.value.isFetching,
  (fetching) => !fetching && resetScroll(),
)
watch(
  () => rows.value.length,
  (next, previous) => {
    if (!cursorMode.value || previous === 0 || next <= previous) return
    appendedFrom.value = previous
    window.clearTimeout(appendTimer)
    appendTimer = window.setTimeout(() => {
      appendedFrom.value = Number.POSITIVE_INFINITY
    }, APPEND_WINDOW)
  },
)
function skeletonColumn(columnId: string) {
  const meta = headerByColumnId.value.get(columnId)?.column.columnDef.meta
  if (meta?.internal === 'selection') return { align: meta.align, skeleton: 'check' as const }
  if (meta?.internal) return { align: meta.align, skeleton: 'none' as const }
  return { align: meta?.align, skeleton: meta?.skeleton }
}

const cursorMode = computed(() => internals.pagination.mode.value === 'cursor')
const loadingMore = computed(
  () => cursorMode.value && internals.pagination.state.value.isLoadingMore,
)
const hasNextPage = computed(() => cursorMode.value && internals.pagination.state.value.hasNextPage)
watch(
  () =>
    [
      virtualRows.value.at(-1)?.index ?? renderRows.value.length - 1,
      renderRows.value.length,
      hasNextPage.value,
      loadingMore.value,
    ] as const,
  ([lastIndex, count, more, loading]) => {
    if (!more || loading || !count) {
      return
    }
    const threshold = Math.max(LOAD_MORE_THRESHOLD, virtualRows.value.length * PREFETCH_VIEWPORTS)
    if (lastIndex >= count - 1 - threshold) {
      void internals.pagination.loadMore()
    }
  },
)
function onScrollLoadMore() {
  if (!hasNextPage.value || loadingMore.value || virtualized.value) {
    return
  }
  const element = scrollRef.value
  if (!element) {
    return
  }
  const threshold = Math.max(320, element.clientHeight * PREFETCH_VIEWPORTS)
  if (element.scrollHeight - element.scrollTop - element.clientHeight < threshold) {
    void internals.pagination.loadMore()
  }
}

watch(
  () => [renderRows.value.length, loadingMore.value] as const,
  async () => {
    await nextTick()
    onScrollLoadMore()
  },
)

defineExpose({ resetColumnSizing })
</script>

<template>
  <div
    class="nut-dl-table relative min-h-0"
    :class="[
      fill ? 'flex h-full flex-col' : '',
      mergeDataListUiClass(undefined, undefined, ui?.wrapper),
    ]"
    :style="{ ...tokenStyle, height: !fill && height ? height : undefined }"
    :data-size="resolvedSize"
    :data-virtualized="virtualized"
    :data-loading="isFirstLoad"
  >
    <div
      ref="scrollRef"
      class="nut-dl-table__scroll relative min-h-0 overflow-auto overscroll-x-contain bg-[var(--nut-dl-surface)]"
      :class="[
        fill || height ? 'flex flex-1 flex-col' : '',
        mergeDataListUiClass(undefined, undefined, ui?.root),
      ]"
      @scroll.passive="onScrollLoadMore"
    >
      <table
        class="nut-dl-table__table w-full table-fixed border-separate border-spacing-0 text-[length:var(--nut-dl-font)]"
        :class="mergeDataListUiClass(undefined, undefined, ui?.base)"
        :style="{ minWidth: `${totalWidth}px` }"
      >
        <colgroup>
          <col
            v-for="col in tableCols"
            :key="col.key"
            :style="col.width ? { width: col.width } : undefined"
          />
        </colgroup>
        <thead :class="mergeDataListUiClass('nut-dl-table__head', undefined, ui?.thead)">
          <tr class="nut-dl-table__head-row">
            <template v-for="slot in columnSlots" :key="slot.key">
              <th
                v-if="slot.kind === 'fill'"
                class="nut-dl-table__fill sticky top-0 z-[3] p-0"
                aria-hidden="true"
              />
              <th
                v-else-if="slot.kind === 'spacer'"
                :colspan="slot.colSpan"
                class="nut-dl-table__spacer sticky top-0 z-[3] p-0"
                aria-hidden="true"
              />
              <th
                v-else-if="headerByColumnId.get(slot.columnId)"
                class="nut-dl-th sticky top-0 z-[3] h-[var(--nut-dl-head-h)] p-0 text-left align-middle"
                :class="[
                  headerByColumnId.get(slot.columnId)!.column.getIsPinned() === 'start'
                    ? 'nut-dl-pin nut-dl-pin--start z-[4]'
                    : '',
                  headerByColumnId.get(slot.columnId)!.column.getIsPinned() === 'end'
                    ? 'nut-dl-pin nut-dl-pin--end z-[4]'
                    : '',
                  isLastStart(headerByColumnId.get(slot.columnId)!.column)
                    ? 'nut-dl-pin--last-start'
                    : '',
                  isFirstEnd(headerByColumnId.get(slot.columnId)!.column)
                    ? 'nut-dl-pin--first-end'
                    : '',
                  headerByColumnId.get(slot.columnId)!.column.columnDef.meta?.internal
                    ? `nut-dl-th--internal nut-dl-th--${headerByColumnId.get(slot.columnId)!.column.columnDef.meta?.internal}`
                    : '',
                  mergeDataListUiClass(undefined, undefined, ui?.th),
                ]"
                :data-col="slot.columnId"
                :style="pinnedOffset(headerByColumnId.get(slot.columnId)!.column)"
              >
                <template
                  v-if="headerByColumnId.get(slot.columnId)!.column.columnDef.meta?.internal"
                >
                  <div
                    class="nut-dl-th__static flex h-full items-center"
                    :class="
                      headerByColumnId.get(slot.columnId)!.column.columnDef.meta?.align === 'right'
                        ? 'justify-end'
                        : ''
                    "
                  >
                    <TableCell
                      v-if="
                        headerByColumnId.get(slot.columnId)!.column.columnDef.meta?.renderHeader
                      "
                      :render="
                        headerByColumnId.get(slot.columnId)!.column.columnDef.meta!.renderHeader!
                      "
                      :row="HEADER_ROW"
                      :index="-1"
                    />
                  </div>
                </template>
                <TableColumnHeader
                  v-else
                  v-bind="headerCellProps.get(slot.columnId)!"
                  :open="openMenuId === slot.columnId"
                  @update:open="openMenuId = $event ? slot.columnId : null"
                />
              </th>
            </template>
          </tr>
        </thead>

        <tbody
          :class="mergeDataListUiClass('nut-dl-table__body', undefined, ui?.tbody)"
          :data-replacing="replacing"
        >
          <tr
            v-if="virtualPaddingTop"
            key="pad-top"
            :style="{ height: `${virtualPaddingTop}px` }"
            aria-hidden="true"
          >
            <td :colspan="columnCount" class="p-0" />
          </tr>

          <TableRow
            v-for="{ row, virtual } in renderedRows"
            :key="virtual.key"
            :ref="measureRow"
            :row-id="String(row.id)"
            :original="row.original"
            :index="virtual.index"
            :cells="rowCells"
            :selected="internals.selection.isRowSelected({ rowId: String(row.id) })"
            :appended="virtual.index >= appendedFrom"
            :row-class="rowClass"
          />

          <tr
            v-if="virtualPaddingBottom"
            key="pad-bottom"
            :style="{ height: `${virtualPaddingBottom}px` }"
            aria-hidden="true"
          >
            <td :colspan="columnCount" class="p-0" />
          </tr>
          <tr
            v-if="loadingMore"
            key="loading-more"
            class="nut-dl-row nut-dl-row--loading-more"
            aria-hidden="true"
          >
            <td :colspan="columnCount" class="nut-dl-td h-[var(--nut-dl-row-h)] py-0 align-middle">
              <div
                class="nut-dl-loading-more flex items-center gap-2.5 px-[var(--nut-dl-gutter)] text-[12.5px] text-muted"
              >
                <span
                  class="nut-dl-spinner size-3.5 rounded-full border-2 border-accented border-t-primary"
                />
                <span>{{ t('table.controls.loadingMore') }}</span>
              </div>
            </td>
          </tr>

          <tr
            v-for="placeholder in isFirstLoad ? skeletonRows : 0"
            :key="`skeleton-${placeholder}`"
            class="nut-dl-row nut-dl-row--skeleton"
            aria-hidden="true"
          >
            <template v-for="slot in columnSlots" :key="slot.key">
              <td v-if="slot.kind === 'fill'" class="nut-dl-table__fill p-0" />
              <td v-else-if="slot.kind === 'spacer'" :colspan="slot.colSpan" class="p-0" />
              <td
                v-else
                class="nut-dl-td h-[var(--nut-dl-row-h)] py-0 align-middle"
                :class="[
                  headerByColumnId.get(slot.columnId)?.column.getIsPinned() === 'start'
                    ? 'nut-dl-pin nut-dl-pin--start z-[2]'
                    : '',
                  headerByColumnId.get(slot.columnId)?.column.getIsPinned() === 'end'
                    ? 'nut-dl-pin nut-dl-pin--end z-[2]'
                    : '',
                  headerByColumnId.get(slot.columnId)?.column.columnDef.meta?.align === 'right'
                    ? 'text-right'
                    : '',
                ]"
                :style="
                  headerByColumnId.get(slot.columnId)
                    ? pinnedOffset(headerByColumnId.get(slot.columnId)!.column)
                    : undefined
                "
              >
                <TableSkeletonCell
                  v-bind="skeletonColumn(slot.columnId)"
                  :seed="placeholder * 7 + slot.columnId.length"
                />
              </td>
            </template>
          </tr>
        </tbody>

        <tfoot
          v-if="summaries.enabled.value && !isFirstLoad && !empty"
          :class="mergeDataListUiClass('nut-dl-table__foot', undefined, ui?.tfoot)"
        >
          <tr class="nut-dl-table__foot-row">
            <template v-for="slot in columnSlots" :key="`foot-${slot.key}`">
              <td
                v-if="slot.kind === 'fill'"
                class="nut-dl-table__fill nut-dl-tf sticky bottom-0 z-[3] p-0"
                aria-hidden="true"
              />
              <td
                v-else-if="slot.kind === 'spacer'"
                :colspan="slot.colSpan"
                class="nut-dl-table__spacer nut-dl-tf sticky bottom-0 z-[3] p-0"
                aria-hidden="true"
              />
              <td
                v-else-if="headerByColumnId.get(slot.columnId)"
                class="nut-dl-tf sticky bottom-0 z-[3] h-[var(--nut-dl-foot-h)] py-0 align-middle"
                :class="[
                  headerByColumnId.get(slot.columnId)!.column.getIsPinned() === 'start'
                    ? 'nut-dl-pin nut-dl-pin--start z-[4]'
                    : '',
                  headerByColumnId.get(slot.columnId)!.column.getIsPinned() === 'end'
                    ? 'nut-dl-pin nut-dl-pin--end z-[4]'
                    : '',
                  isLastStart(headerByColumnId.get(slot.columnId)!.column)
                    ? 'nut-dl-pin--last-start'
                    : '',
                  isFirstEnd(headerByColumnId.get(slot.columnId)!.column)
                    ? 'nut-dl-pin--first-end'
                    : '',
                  headerByColumnId.get(slot.columnId)!.column.columnDef.meta?.align === 'right'
                    ? 'text-right'
                    : headerByColumnId.get(slot.columnId)!.column.columnDef.meta?.align === 'center'
                      ? 'text-center'
                      : '',
                  headerByColumnId.get(slot.columnId)!.column.columnDef.meta?.internal
                    ? `nut-dl-tf--${headerByColumnId.get(slot.columnId)!.column.columnDef.meta?.internal}`
                    : '',
                ]"
                :data-col="slot.columnId"
                :style="pinnedOffset(headerByColumnId.get(slot.columnId)!.column)"
              >
                <div
                  v-if="slot.columnId === summaryLabelColumnId"
                  class="nut-dl-tf__label flex items-center gap-2 whitespace-nowrap"
                >
                  <span
                    class="nut-dl-tf__caption text-[10.5px] tracking-[0.08em] text-muted uppercase"
                  >
                    {{ summaryLabel }}
                  </span>
                  <span class="nut-dl-tf__count tabular-nums">{{
                    formatNumber(summaries.count.value)
                  }}</span>
                  <span class="nut-dl-tf__unit -ml-1 font-normal text-muted">{{
                    summaryUnit
                  }}</span>
                </div>
                <template v-else-if="summaryColumnIds.has(slot.columnId)">
                  <span
                    v-if="summaries.cell(slot.columnId).loading"
                    class="nut-dl-skeleton nut-dl-tf__skeleton inline-block h-3 w-12 rounded-full align-middle"
                    aria-hidden="true"
                  />
                  <span v-else class="nut-dl-tf__value tabular-nums">
                    <component :is="renderSummary(slot.columnId)" />
                  </span>
                </template>
              </td>
            </template>
          </tr>
        </tfoot>
        <tfoot
          v-else-if="$slots.footer"
          :class="mergeDataListUiClass('nut-dl-table__foot', undefined, ui?.tfoot)"
        >
          <slot name="footer" :column-slots="columnSlots" :leaf-columns="leafColumns" />
        </tfoot>
      </table>

      <div
        v-if="error"
        class="nut-dl-table__error sticky left-0 flex w-full flex-col"
        :class="fill || height ? 'min-h-0 flex-1' : ''"
      >
        <slot name="error" :error="error" :retry="refresh">
          <DataListErrorState
            :min-height="fill || height ? undefined : '16rem'"
            :size="resolvedSize"
            class="flex-1"
            @retry="refresh"
          />
        </slot>
      </div>
      <div
        v-else-if="empty"
        class="nut-dl-table__empty sticky left-0 flex w-full flex-col"
        :class="fill || height ? 'min-h-0 flex-1' : ''"
      >
        <slot name="empty">
          <TableEmptyState
            :min-height="fill || height ? undefined : '16rem'"
            :size="resolvedSize"
            class="flex-1"
          />
        </slot>
      </div>
    </div>
    <ProgressLine
      :active="refreshing"
      :restart-key="internals.queryContent.refreshes.value"
      class="absolute inset-x-0 top-[calc(var(--nut-dl-head-h)-1px)] z-[6]"
    />
    <TableOverlayScrollbars ref="scrollbarsRef" :target="scrollRef" />
  </div>
</template>

<style>
.nut-dl-table {
  --nut-dl-surface: var(--nut-dl-table-surface, var(--ui-bg-elevated));
  --nut-dl-line: var(--nut-dl-table-line, var(--ui-border));
  --nut-dl-line-soft: var(--nut-dl-table-line-soft, var(--ui-border-muted));
  --nut-dl-head-bg: var(--nut-dl-table-head-bg, var(--ui-bg-muted));
  --nut-dl-head-fg: var(--nut-dl-table-head-fg, var(--ui-text-muted));
  --nut-dl-head-font: var(--nut-dl-table-head-font, 11px);
  --nut-dl-head-weight: var(--nut-dl-table-head-weight, 600);
  --nut-dl-head-tracking: var(--nut-dl-table-head-tracking, 0.04em);
  --nut-dl-head-transform: var(--nut-dl-table-head-transform, none);
  --nut-dl-row-hover: var(--nut-dl-table-row-hover, var(--ui-bg-muted));
  --nut-dl-row-selected: var(
    --nut-dl-table-row-selected,
    color-mix(in srgb, var(--ui-primary) 10%, var(--nut-dl-surface))
  );
  --nut-dl-accent: var(--ui-primary);
  --nut-dl-cell-fg: var(--nut-dl-table-cell-fg, var(--ui-text-toned));
  --nut-dl-pin-line: var(--nut-dl-table-pin-line, var(--nut-dl-line));
}
.nut-dl-table__scroll {
  scrollbar-width: none;
  overflow-anchor: none;
}
.nut-dl-table__scroll::-webkit-scrollbar {
  display: none;
}
.nut-dl-th {
  background: var(--nut-dl-head-bg);
  color: var(--nut-dl-head-fg);
  font-size: var(--nut-dl-head-font);
  font-weight: var(--nut-dl-head-weight);
  letter-spacing: var(--nut-dl-head-tracking);
  text-transform: var(--nut-dl-head-transform);
  border-bottom: 1px solid var(--nut-dl-line);
  white-space: nowrap;
  user-select: none;
}
.nut-dl-table__spacer,
.nut-dl-table__fill {
  background: var(--nut-dl-head-bg);
  border-bottom: 1px solid var(--nut-dl-line);
}
.nut-dl-tf {
  background: var(--nut-dl-head-bg);
  color: var(--ui-text-highlighted);
  font-weight: var(--nut-dl-table-foot-weight, 500);
  border-top: 1px solid var(--nut-dl-line);
  white-space: nowrap;
}
tfoot .nut-dl-table__spacer,
tfoot .nut-dl-table__fill {
  border-bottom: 0;
  border-top: 1px solid var(--nut-dl-line);
}
.nut-dl-spinner {
  animation: nut-dl-spin 0.8s linear infinite;
}
@keyframes nut-dl-spin {
  to {
    transform: rotate(360deg);
  }
}
tbody .nut-dl-table__spacer {
  background: var(--nut-dl-surface);
  border-bottom: 1px solid var(--nut-dl-line-soft);
}
tbody .nut-dl-table__fill {
  background: inherit;
  border-bottom: 1px solid var(--nut-dl-line-soft);
}
.nut-dl-th__btn--open {
  background: color-mix(in srgb, var(--nut-dl-head-fg) 8%, transparent);
}
.nut-dl-rz::after {
  content: '';
  position: absolute;
  right: 0;
  top: 10px;
  bottom: 10px;
  width: 1px;
  background: var(--ui-border-accented);
  opacity: 0;
  transition: opacity 0.12s;
}
.nut-dl-th:hover .nut-dl-rz::after,
.nut-dl-rz:hover::after {
  opacity: 1;
}
.nut-dl-rz:hover::after,
.nut-dl-rz--active::after {
  background: var(--nut-dl-accent);
  width: 2px;
  left: 2.5px;
  top: 6px;
  bottom: 6px;
  opacity: 1;
}
.nut-dl-row {
  background: var(--nut-dl-surface);
  transition: background-color 0.1s;
}
.nut-dl-row:hover {
  background: var(--nut-dl-row-hover);
}
.nut-dl-row--selected,
.nut-dl-row--selected:hover {
  background: var(--nut-dl-row-selected);
}
.nut-dl-td,
.nut-dl-tf[data-col],
.nut-dl-th__btn,
.nut-dl-th__static {
  padding-left: var(--nut-dl-cell-l, var(--nut-dl-cell-x));
  padding-right: var(--nut-dl-cell-r, var(--nut-dl-cell-x));
}
.nut-dl-row > .nut-dl-td:first-child,
.nut-dl-table__foot-row > .nut-dl-tf:first-child,
.nut-dl-table__head-row > .nut-dl-th:first-child {
  --nut-dl-cell-l: var(--nut-dl-gutter);
}
.nut-dl-row > .nut-dl-td:last-child,
.nut-dl-table__foot-row > .nut-dl-tf:last-child,
.nut-dl-table__head-row > .nut-dl-th:last-child {
  --nut-dl-cell-r: var(--nut-dl-gutter);
}
.nut-dl-td--actions,
.nut-dl-tf--actions,
.nut-dl-row > .nut-dl-td--actions:last-child,
.nut-dl-table__foot-row > .nut-dl-tf--actions:last-child,
.nut-dl-table__head-row > .nut-dl-th--actions:last-child {
  --nut-dl-cell-l: var(--nut-dl-cell-x);
  --nut-dl-cell-r: var(--nut-dl-cell-x);
}
.nut-dl-td--actions .nut-dl-td__inner {
  justify-content: flex-end;
}
.nut-dl-td {
  background: inherit;
  border-bottom: 1px solid var(--nut-dl-line-soft);
  color: var(--nut-dl-cell-fg);
  overflow: hidden;
  white-space: normal;
  overflow-wrap: anywhere;
  padding-block: var(--nut-dl-cell-y, 6px);
  box-sizing: border-box;
}
.nut-dl-td {
  contain: paint;
}
.nut-dl-td__inner {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: var(--nut-dl-lines, 3);
  line-clamp: var(--nut-dl-lines, 3);
  max-height: calc(var(--nut-dl-lines, 3) * 1.5em);
  overflow: hidden;
}
.nut-dl-td--ellipsis {
  --nut-dl-lines: 1;
  white-space: nowrap;
}
.nut-dl-td--ellipsis .nut-dl-td__inner {
  display: block;
  text-overflow: ellipsis;
}
.nut-dl-td--selection .nut-dl-td__inner,
.nut-dl-td--actions .nut-dl-td__inner {
  display: flex;
  align-items: center;
}
.nut-dl-td--selection,
.nut-dl-td--actions {
  white-space: nowrap;
}
.nut-dl-td--actions .nut-dl-td__inner > * {
  opacity: 0.55;
  transition: opacity 0.12s;
}
.nut-dl-row:hover .nut-dl-td--actions .nut-dl-td__inner > * {
  opacity: 1;
}
.nut-dl-pin {
  position: sticky;
}
.nut-dl-pin--last-start::after,
.nut-dl-pin--first-end::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--nut-dl-line);
  pointer-events: none;
}
.nut-dl-pin--last-start::after {
  right: 0;
}
.nut-dl-pin--first-end::before {
  left: 0;
}
.nut-dl-pin--last-start::after,
.nut-dl-pin--first-end::before {
  background: var(--nut-dl-pin-line);
}
.nut-dl-td--actions.nut-dl-pin--first-end::before,
.nut-dl-th--actions.nut-dl-pin--first-end::before {
  display: none;
}
.nut-dl-skeleton {
  background: linear-gradient(
    90deg,
    var(--ui-bg-accented) 0%,
    var(--ui-bg-muted) 45%,
    var(--ui-bg-accented) 100%
  );
  background-size: 200% 100%;
  animation: nut-dl-shimmer 1.6s ease-in-out infinite;
  animation-delay: calc(var(--nut-dl-i, 0) * -90ms);
}
.nut-dl-row--skeleton {
  animation: nut-dl-fade-in 0.18s ease 0.12s both;
}
.nut-dl-row--appended {
  animation: nut-dl-fade-in 0.2s ease both;
}
.nut-dl-table__body {
  transition: opacity 0.16s ease-out;
}
.nut-dl-table__body[data-replacing='true'] {
  opacity: 0.55;
  transition: opacity 0.2s ease-in 0.18s;
}
@keyframes nut-dl-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes nut-dl-shimmer {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: -100% 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .nut-dl-row,
  .nut-dl-table__body {
    transition: none;
  }
  .nut-dl-skeleton,
  .nut-dl-row--skeleton,
  .nut-dl-row--appended {
    animation: none;
  }
}
</style>
