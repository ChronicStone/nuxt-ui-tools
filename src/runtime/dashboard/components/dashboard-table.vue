<script setup lang="ts" generic="TRow">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'
import type { LazyTextValue } from '#ui-tools/shared/types/utils'
import { isNumber, isString } from '#ui-tools/shared/utils/predicate'
import { resolveTextValue } from '#ui-tools/shared/utils/render'

import { useDashboardFormat } from '../composables/use-dashboard-format'
import { useDashboardUi } from '../composables/use-dashboard-ui'
import type {
  DashboardBlockBaseProps,
  DashboardBlockUi,
  DashboardDataTable,
  DashboardRowActions,
  DashboardSelected,
  DashboardSelectEvent,
  DashboardSourceLike,
  DashboardTableColumn,
  DashboardTableSort,
  DashboardTableUi,
} from '../types'
import { resolveDashboardColor } from '../utils/charts'
import { toDashboardCell } from '../utils/export'
import {
  DASHBOARD_TABLE_CLASSES,
  DASHBOARD_TABLE_ROW_BUTTON,
  resolveDashboardClasses,
} from '../utils/ui'
import DashboardRowActionsMenu from './block/dashboard-row-actions.vue'
import DashboardSkeleton from './block/dashboard-skeleton.vue'
import DashboardCard from './dashboard-card.vue'

const {
  source,
  card = true,
  menu = undefined,
  freshness = undefined,
  columns,
  limit,
  maxHeight,
  rowKey,
  selected,
  rowActions,
  onSelect,
  ui,
  ...block
} = defineProps<
  Omit<DashboardBlockBaseProps, 'ui'> & {
    source: DashboardSourceLike<readonly TRow[] | undefined>
    columns: readonly DashboardTableColumn<TRow>[]
    /** Rows shown in the card, after sorting. The expand dialog and CSV export show them all. */
    limit?: number
    /** Caps the table height in pixels; the header stays visible while the rows scroll. */
    maxHeight?: number
    rowKey?: (row: TRow, index: number) => PropertyKey
    /** Rows shown as selected (the value a `select` handler stored). */
    selected?: DashboardSelected<TRow>
    /** Actions of each row, in a last column: inline icon buttons and a `⋮` menu. */
    rowActions?: DashboardRowActions<TRow>
    /** Makes each row a button. */
    onSelect?: (event: DashboardSelectEvent<TRow>) => void
    ui?: DashboardBlockUi & DashboardTableUi
  }
>()

/**
 * Sort state. Header clicks cycle a column through its natural direction (numbers descending, text
 * ascending), the opposite one, then source order. Bind it to keep the sort in a param.
 */
const sort = defineModel<DashboardTableSort | null | undefined>('sort')

defineSlots<
  {
    'header-right'?: () => unknown
    toolbar?: () => unknown
    footer?: () => unknown
  } & {
    /** Custom cell content of the column with this key. */
    [slot: `cell-${string}`]:
      | ((props: { row: TRow; index: number; value: string }) => unknown)
      | undefined
  }
>()

const { t, code } = useUiToolsLocale()
const formats = useDashboardFormat()
const appUi = useDashboardUi()
const classes = computed(() =>
  resolveDashboardClasses(DASHBOARD_TABLE_CLASSES, appUi.value.table, ui),
)

// Full class names, so Tailwind picks them up from the source.
const alignClasses = { center: 'text-center', end: 'text-end', start: 'text-start' } as const

const resolvedColumns = computed(() =>
  columns.map((column) => {
    const type = column.type ?? 'text'
    const numeric = type !== 'text'
    return {
      align: alignClasses[column.align ?? (numeric ? 'end' : 'start')],
      color: resolveDashboardColor(column.color, 0),
      column,
      key: column.key,
      label: resolveTextValue(column.label),
      numeric,
      sortable: column.sortable ?? true,
      type,
    }
  }),
)

type Cell = { value: string | number | null; text: string; good?: boolean; width?: string }

const entries = computed(() => {
  const rows = source.data ?? []
  const values = rows.map((row, index) =>
    resolvedColumns.value.map(({ column }) => resolveCellValue(column.value(row, index))),
  )
  // `bar` columns scale to their largest value, over every row.
  const maxima = resolvedColumns.value.map(({ column, type }, position) =>
    type === 'bar'
      ? (column.max ?? Math.max(0, ...values.map((cells) => cellNumber(cells[position]))))
      : 0,
  )
  return rows.map((row, index) => ({
    cells: resolvedColumns.value.map((resolved, position): Cell => {
      const value = values[index]?.[position] ?? null
      if (value === null || !isNumber(value)) {
        return { text: resolveTextValue(value), value }
      }
      const { column, type } = resolved
      if (type === 'delta') {
        const good = column.invert ? value <= 0 : value >= 0
        return { good, text: (column.format ?? formats.delta.value)(value), value }
      }
      const format =
        column.format ?? (type === 'percent' ? formats.percent.value : formats.number.value)
      const max = maxima[position] ?? 0
      const width =
        type === 'bar' && max > 0
          ? `${Math.max(0, Math.min(100, (value / max) * 100))}%`
          : undefined
      return { text: format(value), value, width }
    }),
    actions: rowActions?.(row, index) ?? [],
    index,
    key: rowKey?.(row, index) ?? index,
    row,
    selected: selected?.(row, index) ?? false,
  }))
})

const sorted = computed(() => {
  const current = sort.value
  const position = current ? resolvedColumns.value.findIndex((c) => c.key === current.key) : -1
  if (!current || position < 0) return entries.value
  const direction = current.direction === 'asc' ? 1 : -1
  return [...entries.value].sort((a, b) =>
    compareCells(a.cells[position]?.value ?? null, b.cells[position]?.value ?? null, direction),
  )
})
const visible = (expanded: boolean) =>
  limit && !expanded ? sorted.value.slice(0, limit) : sorted.value

/** Nulls sort last in both directions; numbers numerically; text with the locale collation. */
function compareCells(a: string | number | null, b: string | number | null, direction: 1 | -1) {
  if (a === null || b === null) return a === b ? 0 : a === null ? 1 : -1
  if (isNumber(a) && isNumber(b)) return (a - b) * direction
  return String(a).localeCompare(String(b), code.value, { numeric: true }) * direction
}

/** Raw value of a cell: lazy values resolved, nullish as `null`. */
function resolveCellValue(raw: LazyTextValue | null | undefined): string | number | null {
  if (raw === null || raw === undefined) return null
  if (isString(raw) || isNumber(raw)) return raw
  return raw()
}

function cellNumber(value: string | number | null | undefined) {
  return isNumber(value) && Number.isFinite(value) ? value : 0
}

function toggleSort(key: string, numeric: boolean) {
  const first = numeric ? 'desc' : 'asc'
  const current = sort.value
  if (current?.key !== key) sort.value = { direction: first, key }
  else if (current.direction === first)
    sort.value = { direction: first === 'asc' ? 'desc' : 'asc', key }
  else sort.value = null
}

function ariaSort(key: string) {
  if (sort.value?.key !== key) return 'none'
  return sort.value.direction === 'asc' ? 'ascending' : 'descending'
}

function tabulate(): DashboardDataTable {
  return {
    columns: resolvedColumns.value.map((column) => ({
      key: column.key,
      label: column.label,
      numeric: column.numeric,
    })),
    rows: sorted.value.map((entry) =>
      entry.cells.map((cell) => toDashboardCell(cell.value, cell.text)),
    ),
  }
}
</script>

<template>
  <DashboardCard
    v-bind="block"
    :card
    :menu
    :freshness
    :ui
    :source
    :is-empty="entries.length === 0"
    :tabulate
    :view-as-table="false"
  >
    <template #skeleton>
      <DashboardSkeleton kind="table" :columns="Math.min(columns.length, 6)" :count="limit ?? 6" />
    </template>
    <template v-if="$slots['header-right']" #header-right>
      <slot name="header-right" />
    </template>
    <template v-if="$slots.toolbar" #toolbar>
      <slot name="toolbar" />
    </template>
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>

    <template #default="{ expanded }">
      <div
        :class="classes.wrapper"
        :style="maxHeight && !expanded ? { maxHeight: `${maxHeight}px` } : undefined"
      >
        <table :class="classes.table">
          <colgroup>
            <col
              v-for="column in resolvedColumns"
              :key="column.key"
              :style="column.column.width ? { width: column.column.width } : undefined"
            />
            <col v-if="rowActions" class="w-0" />
          </colgroup>
          <thead :class="classes.head">
            <tr>
              <th
                v-for="column in resolvedColumns"
                :key="column.key"
                scope="col"
                :aria-sort="column.sortable ? ariaSort(column.key) : undefined"
                :class="[classes.th, column.align]"
              >
                <button
                  v-if="column.sortable"
                  type="button"
                  class="inline-flex cursor-pointer items-center gap-1 hover:text-default"
                  :class="sort?.key === column.key && 'text-default'"
                  @click="toggleSort(column.key, column.numeric)"
                >
                  {{ column.label }}
                  <UIcon
                    :name="
                      sort?.key !== column.key
                        ? 'i-lucide-chevrons-up-down'
                        : sort.direction === 'asc'
                          ? 'i-lucide-arrow-up'
                          : 'i-lucide-arrow-down'
                    "
                    class="size-3 shrink-0"
                    :class="sort?.key !== column.key && 'opacity-50'"
                  />
                </button>
                <template v-else>{{ column.label }}</template>
              </th>
              <th v-if="rowActions" scope="col" :class="classes.th">
                <span class="sr-only">{{ t('dashboard.table.actions') }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="entry in visible(expanded)"
              :key="entry.key"
              :data-selected="entry.selected || undefined"
              :class="[
                classes.row,
                onSelect &&
                  'relative transition-colors has-[>td>button:hover]:bg-elevated/60 has-[>td>button:focus-visible]:bg-elevated/60',
                entry.selected && 'bg-elevated [&>td:first-child]:text-highlighted',
              ]"
            >
              <td
                v-for="(column, position) in resolvedColumns"
                :key="column.key"
                :class="[
                  classes.td,
                  column.align,
                  column.numeric && 'tabular-nums',
                  position === 0 && 'font-medium text-default',
                  column.column.class,
                ]"
              >
                <slot
                  :name="`cell-${column.key}`"
                  :row="entry.row"
                  :index="entry.index"
                  :value="entry.cells[position]?.text ?? ''"
                >
                  <span
                    v-if="column.type === 'delta' && entry.cells[position]?.good !== undefined"
                    :data-trend="entry.cells[position]?.good ? 'up' : 'down'"
                    class="font-semibold"
                    :class="
                      entry.cells[position]?.good
                        ? 'text-[var(--nut-dash-up)]'
                        : 'text-[var(--nut-dash-down)]'
                    "
                  >
                    {{ entry.cells[position]?.text }}
                  </span>
                  <span
                    v-else-if="column.type === 'bar' && entry.cells[position]?.width"
                    class="flex items-center justify-end gap-2"
                  >
                    <span :class="classes.bar" class="w-16 shrink-0 max-sm:w-10">
                      <i
                        class="block h-full rounded-full transition-[width] duration-500 ease-out"
                        :style="{ background: column.color, width: entry.cells[position]?.width }"
                      />
                    </span>
                    <span class="min-w-10">{{ entry.cells[position]?.text }}</span>
                  </span>
                  <template v-else>{{ entry.cells[position]?.text }}</template>
                </slot>
                <button
                  v-if="onSelect && position === 0"
                  type="button"
                  :class="DASHBOARD_TABLE_ROW_BUTTON"
                  :aria-label="entry.cells[0]?.text"
                  :aria-pressed="selected ? entry.selected : undefined"
                  @click="onSelect({ index: entry.index, row: entry.row })"
                />
              </td>
              <td v-if="rowActions" :class="[classes.td, 'py-0']">
                <DashboardRowActionsMenu
                  v-if="entry.actions.length"
                  :actions="entry.actions"
                  :label="entry.cells[0]?.text ?? ''"
                  class="justify-end"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </DashboardCard>
</template>
