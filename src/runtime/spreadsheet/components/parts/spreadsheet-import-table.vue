<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { computed, shallowRef, useTemplateRef } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useSpreadsheetImporter } from '../../composables/use-spreadsheet-import-context'
import type {
  SpreadsheetCellView,
  SpreadsheetFieldState,
  SpreadsheetImporter,
  SpreadsheetRecord,
  SpreadsheetRow,
} from '../../types'
import SpreadsheetImportCellEditor from '../internal/spreadsheet-import-cell-editor.vue'
import SpreadsheetImportStatusBadge from '../internal/spreadsheet-import-status-badge.vue'

const ROW_HEIGHT = 38
/** Small files render every row; larger ones are virtualized. */
const VIRTUALIZE_FROM = 150

const props = withDefaults(
  defineProps<{
    importer?: SpreadsheetImporter
    /** Height of the scrolling area. */
    height?: string
    /** Field paths to show, in order. Defaults to every field. */
    fields?: readonly string[]
    /** Cells can be edited. Defaults to `true`. */
    editable?: boolean
    /** Rows can be selected. Defaults to `true`. */
    selectable?: boolean
  }>(),
  { editable: true, fields: undefined, height: '30rem', selectable: true },
)
defineSlots<{
  cell?: (props: {
    row: SpreadsheetRow<SpreadsheetRecord, unknown>
    field: SpreadsheetFieldState
    cell: SpreadsheetCellView
  }) => unknown
}>()
const importer = useSpreadsheetImporter(() => props.importer)
const { t } = useUiToolsLocale()
const scroller = useTemplateRef<HTMLElement>('scroller')
const editing = shallowRef<{ index: number; field: string } | null>(null)

const columns = computed(() => {
  const all = importer.value.columns.fields
  if (!props.fields) return all
  return props.fields.flatMap((path) => all.filter((field) => field.path === path))
})
const rows = computed(() => importer.value.review.visible)
/** Options of a select cell, for its row: they may depend on the columns before it. */
function choicesOf(row: SpreadsheetRow<SpreadsheetRecord, unknown>, field: SpreadsheetFieldState) {
  return field.kind === 'select'
    ? importer.value.rows.cell(row.index, field.path).choices.map((option) => option.label)
    : undefined
}

const virtualized = computed(() => rows.value.length > VIRTUALIZE_FROM)
const virtualizer = useVirtualizer(
  computed(() => ({
    count: virtualized.value ? rows.value.length : 0,
    estimateSize: () => ROW_HEIGHT,
    getItemKey: (index: number) => rows.value[index]?.index ?? index,
    getScrollElement: () => scroller.value,
    initialRect: { height: 480, width: 1200 },
    overscan: 12,
  })),
)
const items = computed(() =>
  virtualized.value
    ? virtualizer.value.getVirtualItems().map((item) => item.index)
    : rows.value.map((_, index) => index),
)
const padTop = computed(() =>
  virtualized.value ? (virtualizer.value.getVirtualItems()[0]?.start ?? 0) : 0,
)
const padBottom = computed(() =>
  virtualized.value
    ? virtualizer.value.getTotalSize() - (virtualizer.value.getVirtualItems().at(-1)?.end ?? 0)
    : 0,
)
const allSelected = computed(
  () =>
    rows.value.length > 0 &&
    rows.value.every((row) => importer.value.review.selection.has(row.index)),
)

function rowOf(position: number) {
  return rows.value[position]
}

function cellOf(row: SpreadsheetRow<SpreadsheetRecord, unknown>, field: SpreadsheetFieldState) {
  return importer.value.rows.cell(row.index, field.path)
}

function isEditing(row: SpreadsheetRow<SpreadsheetRecord, unknown>, field: SpreadsheetFieldState) {
  return editing.value?.index === row.index && editing.value.field === field.path
}

function edit(row: SpreadsheetRow<SpreadsheetRecord, unknown>, field: SpreadsheetFieldState) {
  if (props.editable && !row.discardReason && !isEditing(row, field))
    editing.value = { field: field.path, index: row.index }
}

function commit(
  row: SpreadsheetRow<SpreadsheetRecord, unknown>,
  field: SpreadsheetFieldState,
  text: string,
  move?: 1 | -1,
) {
  if (text !== importer.value.rows.cell(row.index, field.path).text)
    importer.value.rows.edit(row.index, field.path, text)
  if (!move) {
    editing.value = null
    return
  }
  const next = columns.value[columns.value.findIndex((column) => column.path === field.path) + move]
  editing.value = next ? { field: next.path, index: row.index } : null
}

function cellClass(row: SpreadsheetRow<SpreadsheetRecord, unknown>, field: SpreadsheetFieldState) {
  const cell = cellOf(row, field)
  const level = cell.issue?.level
  if (isEditing(row, field)) return 'bg-default ring-2 ring-inset ring-primary'
  return [
    level === 'error' ? 'bg-error/8 text-error ring-1 ring-inset ring-error/40' : '',
    level === 'warning' ? 'bg-warning/8 text-warning ring-1 ring-inset ring-warning/35' : '',
    cell.stored !== null && !level ? 'bg-info/6' : '',
    row.discardReason ? 'text-dimmed' : '',
    props.editable && !row.discardReason
      ? 'cursor-text hover:ring-1 hover:ring-inset hover:ring-accented'
      : '',
  ]
}

function rowBar(row: SpreadsheetRow<SpreadsheetRecord, unknown>) {
  if (row.index === importer.value.review.inspected?.index)
    return 'shadow-[inset_3px_0_0_var(--ui-primary)]'
  if (row.status === 'blocking') return 'shadow-[inset_3px_0_0_var(--ui-error)]'
  if (row.status === 'warning') return 'shadow-[inset_3px_0_0_var(--ui-warning)]'
  return ''
}

function toggleRow(index: number, event: Event) {
  if (event.target instanceof HTMLInputElement)
    importer.value.review.select([index], event.target.checked)
}

function toggleAll(event: Event) {
  if (event.target instanceof HTMLInputElement)
    importer.value.review.select(
      rows.value.map((row) => row.index),
      event.target.checked,
    )
}

function filterField(field: SpreadsheetFieldState) {
  importer.value.review.setIssue(`${field.path}|*`)
}

function sourceOf(field: SpreadsheetFieldState) {
  if (field.header) return field.header.text
  if (field.status === 'default') return t('spreadsheet.table.defaulted')
  return '—'
}
</script>

<template>
  <div
    ref="scroller"
    data-spreadsheet-table
    class="relative min-w-0 overflow-auto bg-default"
    :style="{ height }"
  >
    <table class="w-full min-w-max border-separate border-spacing-0 text-[13px]">
      <thead>
        <tr>
          <th
            class="sticky top-0 left-0 z-30 border-e border-b border-default bg-elevated px-3 py-2 text-start text-xs font-medium text-muted"
          >
            <span class="flex items-center gap-2.5">
              <input
                v-if="selectable"
                type="checkbox"
                class="size-4 accent-primary"
                :checked="allSelected"
                :aria-label="t('spreadsheet.table.selectAll')"
                @change="toggleAll"
              />
              {{ t('spreadsheet.table.row') }}
            </span>
          </th>
          <th
            v-for="field in columns"
            :key="field.path"
            class="sticky top-0 z-20 border-b border-default bg-elevated px-3 py-2 text-start align-bottom font-medium whitespace-nowrap"
          >
            <span class="flex items-center gap-1.5 text-xs text-toned">
              <span v-if="field.group" class="font-normal text-dimmed"
                >{{ field.group.label }} ·</span
              >
              {{ field.label }}
              <button
                v-if="importer.review.fieldIssues.get(field.path)"
                type="button"
                class="h-4.5 min-w-4.5 rounded-full px-1.5 text-[11px] leading-[18px] font-bold tabular-nums"
                :class="
                  importer.review.fieldIssues.get(field.path)?.level === 'error'
                    ? 'bg-error text-inverted'
                    : 'bg-warning/15 text-warning ring-1 ring-warning ring-inset'
                "
                @click="filterField(field)"
              >
                {{ importer.review.fieldIssues.get(field.path)?.rowCount }}
              </button>
            </span>
            <span class="block max-w-52 truncate text-[11px] font-normal text-dimmed">{{
              sourceOf(field)
            }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="padTop" aria-hidden="true">
          <td :colspan="columns.length + 1" :style="{ height: `${padTop}px` }" />
        </tr>
        <template v-for="position in items" :key="rowOf(position)?.index">
          <tr
            v-if="rowOf(position)"
            :data-spreadsheet-row="rowOf(position)!.index"
            :data-status="rowOf(position)!.status"
            :class="
              rowOf(position)!.index === importer.review.inspected?.index ? 'bg-primary/6' : ''
            "
          >
            <td
              class="sticky left-0 z-10 border-e border-b border-default bg-default px-3"
              :class="rowBar(rowOf(position)!)"
              :style="{ height: `${ROW_HEIGHT}px` }"
            >
              <span class="flex items-center gap-2">
                <input
                  v-if="selectable"
                  type="checkbox"
                  class="size-4 accent-primary"
                  :checked="importer.review.selection.has(rowOf(position)!.index)"
                  :aria-label="
                    t('spreadsheet.table.selectRow', { row: rowOf(position)!.rowNumber })
                  "
                  @change="(event) => toggleRow(rowOf(position)!.index, event)"
                />
                <button
                  type="button"
                  data-spreadsheet-inspect
                  class="flex items-center gap-1.5 rounded-md px-1 py-0.5 hover:bg-accented"
                  :title="t('spreadsheet.table.inspectRow', { row: rowOf(position)!.rowNumber })"
                  @click="importer.review.inspect(rowOf(position)!.index)"
                >
                  <span class="min-w-7 text-end font-mono text-[11.5px] text-dimmed tabular-nums">{{
                    rowOf(position)!.rowNumber
                  }}</span>
                  <SpreadsheetImportStatusBadge
                    :status="rowOf(position)!.status"
                    :count="rowOf(position)!.errors.length || rowOf(position)!.warnings.length"
                  />
                  <UIcon
                    v-if="rowOf(position)!.mode === 'update' && !rowOf(position)!.discardReason"
                    name="i-lucide-refresh-cw"
                    class="size-3.5 text-info"
                    :title="t('spreadsheet.table.modeUpdate')"
                  />
                </button>
              </span>
            </td>
            <td
              v-for="field in columns"
              :key="field.path"
              :data-spreadsheet-cell="field.path"
              class="relative max-w-72 border-b border-default p-0 whitespace-nowrap"
              :class="cellClass(rowOf(position)!, field)"
              :title="
                cellOf(rowOf(position)!, field).issue?.message ??
                (cellOf(rowOf(position)!, field).stored !== null
                  ? t('spreadsheet.table.stored', {
                      value: cellOf(rowOf(position)!, field).stored ?? '',
                    })
                  : undefined)
              "
              @click="edit(rowOf(position)!, field)"
            >
              <div
                class="flex h-[37px] items-center"
                :class="isEditing(rowOf(position)!, field) ? '' : 'px-3'"
              >
                <SpreadsheetImportCellEditor
                  v-if="isEditing(rowOf(position)!, field)"
                  :text="cellOf(rowOf(position)!, field).text"
                  :choices="choicesOf(rowOf(position)!, field)"
                  @commit="(text, move) => commit(rowOf(position)!, field, text, move)"
                  @cancel="editing = null"
                />
                <slot
                  v-else
                  name="cell"
                  :row="rowOf(position)!"
                  :field="field"
                  :cell="cellOf(rowOf(position)!, field)"
                >
                  <span class="flex min-w-0 items-center gap-1.5">
                    <UIcon
                      v-if="cellOf(rowOf(position)!, field).issue?.level === 'error'"
                      name="i-lucide-circle-x"
                      class="size-3.5 shrink-0"
                    />
                    <UIcon
                      v-else-if="cellOf(rowOf(position)!, field).issue?.level === 'warning'"
                      name="i-lucide-triangle-alert"
                      class="size-3.5 shrink-0"
                    />
                    <span
                      class="truncate"
                      :class="{
                        'italic opacity-60': !cellOf(rowOf(position)!, field).display,
                        'text-info': cellOf(rowOf(position)!, field).defaulted,
                        'line-through decoration-dimmed': rowOf(position)!.discardReason,
                      }"
                    >
                      {{
                        cellOf(rowOf(position)!, field).display ||
                        cellOf(rowOf(position)!, field).text ||
                        t('spreadsheet.table.emptyCell')
                      }}
                    </span>
                    <span
                      v-if="cellOf(rowOf(position)!, field).created"
                      class="shrink-0 rounded bg-primary/10 px-1 text-[10.5px] leading-4 font-semibold text-primary"
                    >
                      {{ t('spreadsheet.table.created') }}
                    </span>
                  </span>
                </slot>
              </div>
              <span
                v-if="cellOf(rowOf(position)!, field).edited"
                class="absolute top-0 right-0 size-0 border-t-[9px] border-l-[9px] border-t-primary border-l-transparent"
              />
            </td>
          </tr>
        </template>
        <tr v-if="padBottom > 0" aria-hidden="true">
          <td :colspan="columns.length + 1" :style="{ height: `${padBottom}px` }" />
        </tr>
      </tbody>
    </table>
    <p v-if="!rows.length" class="px-6 py-16 text-center text-sm text-muted">
      {{ t('spreadsheet.table.empty') }}
    </p>
  </div>
</template>
