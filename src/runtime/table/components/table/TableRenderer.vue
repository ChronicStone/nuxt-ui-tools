<script setup lang="ts">
import { useVirtualizer } from '@tanstack/vue-virtual'
import type { Virtualizer } from '@tanstack/vue-virtual'
import {
  computed,
  h,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  TransitionGroup,
  useTemplateRef,
  watch,
} from 'vue'
import type { ComponentPublicInstance } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { isDefined, isFunction, isNumber, isObject } from '../../../shared/utils/predicate'
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
import TableCell from './TableCell'
import TableColumnHeader from './TableColumnHeader.vue'
import TableEmptyState from './TableEmptyState.vue'
import TableOverlayScrollbars from './TableOverlayScrollbars.vue'

const LOAD_MORE_THRESHOLD = 6
const VIRTUALIZE_ROW_THRESHOLD = 40
const VIRTUALIZE_CELL_THRESHOLD = 240
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
    (status.value.isPending && rows.value.length === 0) ||
    (!rowsMounted.value && rows.value.length > 0),
)
const refreshing = computed(
  () => rows.value.length > 0 && (status.value.isFetching || status.value.isRefreshing),
)
const empty = computed(() => !isFirstLoad.value && rows.value.length === 0)

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
const rowVirtualizer = useVirtualizer(
  computed(() => ({
    count: virtualized.value ? renderRows.value.length : 0,
    estimateSize: () => rowHeight.value,
    getItemKey: (index: number) =>
      renderRows.value[index] ? getRowId(renderRows.value[index]!, index) : index,
    getScrollElement: () => scrollRef.value ?? null,
    measureElement: (element: Element) => element.getBoundingClientRect().height,
    overscan: 8,
  })),
)
const virtualRows = computed(() =>
  virtualized.value ? rowVirtualizer.value.getVirtualItems() : [],
)
const materializedRows = computed(() =>
  virtualized.value
    ? virtualRows.value.map((item) => renderRows.value[item.index]).filter(isDefined)
    : renderRows.value,
)

const { table, resetColumnSizing } = useTanstackTable({
  columnSizing,
  columns: columnDefs,
  data: materializedRows,
  getRowId,
  pinned,
})

const tableRows = computed(() => table.getRowModel().rows)
const leafColumns = computed(() => table.getVisibleLeafColumns())
const centerColumns = computed(() => table.getCenterVisibleLeafColumns())
const bodyWidth = ref(0)
const bodyHeight = ref(0)
const columnsOverflow = computed(
  () => bodyWidth.value > 0 && table.getTotalSize() > bodyWidth.value,
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

type ColumnSlot =
  | { kind: 'column'; columnId: string; key: string }
  | { kind: 'spacer'; colSpan: number; key: string }

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
    slots.push(...centerColumns.value.map(asSlot), ...table.getEndVisibleLeafColumns().map(asSlot))
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

type TableRow = (typeof tableRows.value)[number]
type CellSlot =
  | { kind: 'cell'; cell: ReturnType<TableRow['getVisibleCells']>[number]; key: string }
  | Extract<ColumnSlot, { kind: 'spacer' }>

function rowColumnSlots(row: TableRow): CellSlot[] {
  const cells = new Map(row.getVisibleCells().map((cell) => [cell.column.id, cell]))
  const slots: CellSlot[] = []
  for (const slot of columnSlots.value) {
    if (slot.kind === 'spacer') {
      slots.push(slot)
      continue
    }
    const cell = cells.get(slot.columnId)
    if (cell) {
      slots.push({ cell, key: cell.id, kind: 'cell' })
    }
  }
  return slots
}

const headers = computed(() => table.getHeaderGroups()[0]?.headers ?? [])
const headerByColumnId = computed(() => new Map(headers.value.map((h) => [h.column.id, h])))

const virtualPaddingTop = computed(() => virtualRows.value[0]?.start ?? 0)
const virtualPaddingBottom = computed(() => {
  if (!virtualized.value || !virtualRows.value.length) {
    return 0
  }
  return rowVirtualizer.value.getTotalSize() - (virtualRows.value.at(-1)?.end ?? 0)
})
const virtualRowByKey = computed(() => {
  const byKey = new Map<string, { index: number; key: string }>()
  for (const item of virtualRows.value) {
    const row = renderRows.value[item.index]
    if (row) {
      byKey.set(getRowId(row, item.index), { index: item.index, key: String(item.key) })
    }
  }
  return byKey
})
const renderedRows = computed(() => {
  if (!virtualized.value) {
    return tableRows.value.map((row, index) => ({ row, virtual: { index, key: String(row.id) } }))
  }
  return tableRows.value
    .map((row) => {
      const virtual = virtualRowByKey.value.get(String(row.id))
      return virtual ? { row, virtual } : undefined
    })
    .filter(isDefined)
})

function measureRow(element: Element | ComponentPublicInstance | null) {
  if (!(element instanceof HTMLElement)) {
    return
  }
  if (element.isConnected) {
    rowVirtualizer.value.measureElement(element)
  } else {
    nextTick(() => element.isConnected && rowVirtualizer.value.measureElement(element))
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
  return
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
  return t('table.summaries.total')
})
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

const dataEpoch = ref(0)
const animateEpoch = ref(false)
watch(
  () => [
    internals.pagination.currentPage.value,
    internals.pagination.pageSize.value,
    JSON.stringify(internals.tableColumns.sortingState.value),
    JSON.stringify(internals.queryState.filters.value),
    internals.filters.searchQuery.value,
  ],
  () => {
    if (!rowsMounted.value || cursorMode.value) {
      return
    }
    dataEpoch.value++
    animateEpoch.value = true
    scrollRef.value?.scrollTo({ top: 0 })
  },
)
const SKELETON_WIDTHS = [62, 44, 78, 54, 70, 38, 66, 48]
function skeletonWidth(seed: number) {
  return SKELETON_WIDTHS[seed % SKELETON_WIDTHS.length]!
}
function renderSkeletonCell(columnId: string, rowIndex: number) {
  const meta = headerByColumnId.value.get(columnId)?.column.columnDef.meta
  const kind =
    meta?.internal === 'selection' ? 'check' : meta?.internal ? 'none' : (meta?.skeleton ?? 'text')
  const seed = rowIndex * 7 + columnId.length
  function line(width: number, extra = '') {
    return h('span', {
      class: `nut-dl-skeleton block h-3 rounded ${extra}`,
      style: { width: `${width}%` },
    })
  }
  return () => {
    if (kind === 'none') {
      return null
    }
    if (kind === 'check') {
      return h('span', { class: 'nut-dl-skeleton block size-4 rounded-[4px]' })
    }
    if (kind === 'dot') {
      return h('span', { class: 'flex items-center gap-2' }, [
        h('span', { class: 'nut-dl-skeleton size-[7px] rounded-full' }),
        line(skeletonWidth(seed) - 10),
      ])
    }
    if (kind === 'avatar') {
      return h('span', { class: 'flex items-center gap-2.5' }, [
        h('span', { class: 'nut-dl-skeleton size-7 shrink-0 rounded-md' }),
        h('span', { class: 'grid flex-1 gap-1.5' }, [
          line(skeletonWidth(seed)),
          line(skeletonWidth(seed + 3) - 20, 'h-2.5'),
        ]),
      ])
    }
    if (kind === 'badge') {
      return h('span', { class: 'nut-dl-skeleton inline-block h-5 w-16 rounded-full' })
    }
    if (kind === 'number') {
      return h('span', {
        class: 'nut-dl-skeleton ml-auto block h-3 rounded',
        style: { width: '36%' },
      })
    }
    return line(skeletonWidth(seed))
  }
}
watch(isFirstLoad, (loading, was) => {
  if (was && !loading) {
    animateEpoch.value = true
  }
})

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
    if (lastIndex >= count - 1 - LOAD_MORE_THRESHOLD) {
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
  if (element.scrollHeight - element.scrollTop - element.clientHeight < 320) {
    void internals.pagination.loadMore()
  }
}

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
        fill || height ? 'flex-1' : '',
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
            v-for="leaf in leafColumns"
            :key="leaf.id"
            :style="{ width: `${leaf.getSize()}px` }"
          />
        </colgroup>
        <thead :class="mergeDataListUiClass('nut-dl-table__head', undefined, ui?.thead)">
          <tr class="nut-dl-table__head-row">
            <template v-for="slot in columnSlots" :key="slot.key">
              <th
                v-if="slot.kind === 'spacer'"
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
                        () =>
                          headerByColumnId.get(slot.columnId)!.column.columnDef.meta!
                            .renderHeader!()
                      "
                      :row="{}"
                      :index="-1"
                    />
                  </div>
                </template>
                <TableColumnHeader
                  v-else
                  :open="openMenuId === slot.columnId"
                  :label="headerByColumnId.get(slot.columnId)!.column.columnDef.meta!.label"
                  :icon="headerByColumnId.get(slot.columnId)!.column.columnDef.meta!.icon"
                  :align="headerByColumnId.get(slot.columnId)!.column.columnDef.meta!.align"
                  :sortable="headerByColumnId.get(slot.columnId)!.column.columnDef.meta!.sortable"
                  :sort-state="internals.tableColumns.getSortState({ columnId: slot.columnId })"
                  :pinned="
                    Boolean(internals.tableColumns.getPinnedState({ columnId: slot.columnId }))
                  "
                  :items="internals.tableColumns.getMenuItems({ columnId: slot.columnId })"
                  :resizable="headerByColumnId.get(slot.columnId)!.column.getCanResize()"
                  :resizing="headerByColumnId.get(slot.columnId)!.column.getIsResizing()"
                  :reset-size="() => headerByColumnId.get(slot.columnId)!.column.resetSize()"
                  :resize="headerByColumnId.get(slot.columnId)!.getResizeHandler()"
                  @update:open="openMenuId = $event ? slot.columnId : null"
                />
              </th>
            </template>
          </tr>
          <tr v-if="refreshing" class="nut-dl-progress" aria-hidden="true">
            <th
              :colspan="leafColumns.length"
              class="sticky top-[var(--nut-dl-head-h)] z-[3] h-0 p-0"
            >
              <span />
            </th>
          </tr>
        </thead>

        <component
          :is="virtualized ? 'tbody' : TransitionGroup"
          :key="virtualized ? dataEpoch : 'rows'"
          :tag="virtualized ? undefined : 'tbody'"
          :class="mergeDataListUiClass('nut-dl-table__body', undefined, ui?.tbody)"
          :move-class="virtualized ? undefined : 'nut-dl-row--moving'"
          :enter-active-class="virtualized ? undefined : 'nut-dl-row--settling'"
          :enter-from-class="virtualized ? undefined : 'nut-dl-row--from'"
          :leave-active-class="virtualized ? undefined : 'hidden'"
        >
          <tr
            v-if="virtualPaddingTop"
            key="pad-top"
            :style="{ height: `${virtualPaddingTop}px` }"
            aria-hidden="true"
          >
            <td :colspan="leafColumns.length" class="p-0" />
          </tr>

          <tr
            v-for="{ row, virtual } in renderedRows"
            :key="virtual.key"
            :ref="measureRow"
            class="nut-dl-row group/row"
            :class="[
              internals.selection.isRowSelected({ rowId: String(row.id) })
                ? 'nut-dl-row--selected'
                : '',
              mergeDataListUiClass(undefined, undefined, ui?.tr),
            ]"
            :data-index="virtual.index"
            :data-row-id="row.id"
            :style="
              virtualized && animateEpoch
                ? { '--nut-dl-i': Math.min(virtual.index - (virtualRows[0]?.index ?? 0), 24) }
                : undefined
            "
          >
            <template v-for="slot in rowColumnSlots(row)" :key="slot.key">
              <td
                v-if="slot.kind === 'spacer'"
                :colspan="slot.colSpan"
                class="nut-dl-table__spacer p-0"
                aria-hidden="true"
              />
              <td
                v-else
                class="nut-dl-td h-[var(--nut-dl-row-h)] py-0 align-middle"
                :class="[
                  slot.cell.column.getIsPinned() === 'start'
                    ? 'nut-dl-pin nut-dl-pin--start z-[2]'
                    : '',
                  slot.cell.column.getIsPinned() === 'end'
                    ? 'nut-dl-pin nut-dl-pin--end z-[2]'
                    : '',
                  isLastStart(slot.cell.column) ? 'nut-dl-pin--last-start' : '',
                  isFirstEnd(slot.cell.column) ? 'nut-dl-pin--first-end' : '',
                  slot.cell.column.columnDef.meta?.align === 'right'
                    ? 'text-right'
                    : slot.cell.column.columnDef.meta?.align === 'center'
                      ? 'text-center'
                      : '',
                  slot.cell.column.columnDef.meta?.internal
                    ? `nut-dl-td--${slot.cell.column.columnDef.meta.internal}`
                    : '',
                  slot.cell.column.columnDef.meta?.ellipsis ? 'nut-dl-td--ellipsis' : '',
                  mergeDataListUiClass(undefined, undefined, ui?.td),
                ]"
                :data-col="slot.cell.column.id"
                :style="[
                  pinnedOffset(slot.cell.column),
                  slot.cell.column.columnDef.meta?.lines
                    ? { '--nut-dl-lines': slot.cell.column.columnDef.meta.lines }
                    : undefined,
                ]"
              >
                <div
                  class="nut-dl-td__inner min-w-0"
                  :class="
                    slot.cell.column.columnDef.meta?.align === 'right'
                      ? 'justify-end'
                      : slot.cell.column.columnDef.meta?.align === 'center'
                        ? 'justify-center'
                        : ''
                  "
                >
                  <TableCell
                    :index="virtual.index"
                    :render="slot.cell.column.columnDef.meta!.render"
                    :row="row.original"
                  />
                </div>
              </td>
            </template>
          </tr>

          <tr
            v-if="loadingMore"
            key="loading-more"
            class="nut-dl-row nut-dl-row--loading-more"
            aria-hidden="true"
          >
            <td
              :colspan="leafColumns.length"
              class="nut-dl-td h-[var(--nut-dl-row-h)] py-0 align-middle"
            >
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
            v-if="virtualPaddingBottom"
            key="pad-bottom"
            :style="{ height: `${virtualPaddingBottom}px` }"
            aria-hidden="true"
          >
            <td :colspan="leafColumns.length" class="p-0" />
          </tr>

          <tr
            v-for="placeholder in isFirstLoad ? skeletonRows : 0"
            :key="`skeleton-${placeholder}`"
            class="nut-dl-row nut-dl-row--skeleton"
            :style="{ '--nut-dl-i': placeholder }"
            aria-hidden="true"
          >
            <template v-for="slot in columnSlots" :key="slot.key">
              <td v-if="slot.kind === 'spacer'" :colspan="slot.colSpan" class="p-0" />
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
                <component :is="renderSkeletonCell(slot.columnId, placeholder)" />
              </td>
            </template>
          </tr>
        </component>

        <tfoot
          v-if="summaries.enabled.value && !isFirstLoad && !empty"
          :class="mergeDataListUiClass('nut-dl-table__foot', undefined, ui?.tfoot)"
        >
          <tr class="nut-dl-table__foot-row">
            <template v-for="slot in columnSlots" :key="`foot-${slot.key}`">
              <td
                v-if="slot.kind === 'spacer'"
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

      <div v-if="empty" class="nut-dl-table__empty sticky left-0 w-full">
        <slot name="empty">
          <TableEmptyState
            :min-height="fill ? 'calc(100% - var(--nut-dl-head-h))' : '16rem'"
            :size="resolvedSize"
          />
        </slot>
      </div>
    </div>
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
.nut-dl-table__spacer {
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
tfoot .nut-dl-table__spacer {
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
.nut-dl-th__btn,
.nut-dl-th__static {
  padding-left: var(--nut-dl-cell-l, var(--nut-dl-cell-x));
  padding-right: var(--nut-dl-cell-r, var(--nut-dl-cell-x));
}
.nut-dl-row > .nut-dl-td:first-child,
.nut-dl-table__head-row > .nut-dl-th:first-child {
  --nut-dl-cell-l: var(--nut-dl-gutter);
}
.nut-dl-row > .nut-dl-td:last-child,
.nut-dl-table__head-row > .nut-dl-th:last-child {
  --nut-dl-cell-r: var(--nut-dl-gutter);
}
.nut-dl-td--actions,
.nut-dl-row > .nut-dl-td--actions:last-child,
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
.nut-dl-progress th {
  overflow: hidden;
}
.nut-dl-progress th span {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--nut-dl-accent), transparent);
  background-size: 40% 100%;
  animation: nut-dl-progress 1s ease-in-out infinite;
}
@keyframes nut-dl-progress {
  from {
    background-position: -40% 0;
  }
  to {
    background-position: 140% 0;
  }
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
  animation: nut-dl-fade-in 0.2s ease both;
  animation-delay: calc(var(--nut-dl-i, 0) * 18ms);
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
.nut-dl-table[data-virtualized='true'] .nut-dl-row[style*='--nut-dl-i'] {
  animation: nut-dl-row-in 0.22s cubic-bezier(0.2, 0.9, 0.3, 1) both;
  animation-delay: calc(var(--nut-dl-i) * 10ms);
}
@keyframes nut-dl-row-in {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.nut-dl-row--moving {
  transition: transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1);
}
.nut-dl-row--settling {
  transition:
    opacity 0.18s ease,
    transform 0.24s cubic-bezier(0.2, 0.9, 0.3, 1);
}
.nut-dl-row--from {
  opacity: 0;
  transform: translateY(4px);
}
@media (prefers-reduced-motion: reduce) {
  .nut-dl-row--moving,
  .nut-dl-row--settling,
  .nut-dl-row {
    transition: none;
  }
  .nut-dl-skeleton,
  .nut-dl-progress th span,
  .nut-dl-table[data-virtualized='true'] .nut-dl-row[style*='--nut-dl-i'] {
    animation: none;
  }
}
</style>
