<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'

import { useGridRow, useProvideGridRow } from '../../composables/use-grid-row'
import { useTableInternals } from '../../composables/use-table-internals'
import type { GenericObject, TableSchemaView } from '../../types'
import TableRowScopeProvider from '../actions/table-row-scope-provider.vue'
import TableSelectionControl from '../table/table-selection-control.vue'

const props = defineProps<{
  rowIndex?: number
}>()

const internals = useTableInternals()
const injectedRowIndex = props.rowIndex === undefined ? useGridRow() : null
const localRowIndex = computed(() => props.rowIndex ?? injectedRowIndex ?? 0)
const rowData = computed(() => internals.grid.rows.value[localRowIndex.value])
const selectable = computed(
  () => internals.selection.selectionEnabled.value && Boolean(rowData.value),
)
const rowId = computed(() =>
  rowData.value
    ? internals.selection.getRowId({ index: localRowIndex.value, row: rowData.value })
    : '',
)
const selected = computed(() => internals.selection.isRowSelected({ rowId: rowId.value }))
type GridRenderItem = NonNullable<NonNullable<TableSchemaView['grid']>['renderItem']>
type GridRenderParams = Parameters<GridRenderItem>[0]

useProvideGridRow(localRowIndex.value)

const showControl = computed(
  () => selectable.value && internals.schema.value.grid?.selectControl !== false,
)

const rowParams = computed(() =>
  createGridRenderParams({
    context: toPlainRecord(internals.queryContent.contextData.value),
    index: localRowIndex.value,
    layout: 'grid',
    pageContext: toPlainRecord(internals.queryContent.pageContextData.value),
    row: rowData.value ?? {},
    selection: {
      enabled: selectable.value,
      renderControl,
      selected: selected.value,
      toggle: (options) => toggleSelection(options ?? {}),
    },
    tableApi: internals.tableApi,
  }),
)

const RenderGridCard = defineComponent({
  name: 'RenderGridCard',
  setup() {
    return () => internals.schema.value.grid?.renderItem?.(rowParams.value) ?? null
  },
})

/** The same toggle as the table's checkbox, so both layouts edit one selection. */
function toggleSelection(options: { shiftKey?: boolean }) {
  internals.selection.toggleRowSelection({
    rowId: rowId.value,
    selected: !selected.value,
    shiftKey: options.shiftKey,
  })
}

function renderControl(options: { class?: string } = {}) {
  const row = rowData.value
  if (!selectable.value || !row) return null
  return h(TableSelectionControl, {
    class: options.class,
    index: localRowIndex.value,
    modelValue: selected.value,
    onToggle: (event: MouseEvent) => toggleSelection(event),
    row,
  })
}

function createGridRenderParams(params: GridRenderParams) {
  return params
}

function toPlainRecord(value: GenericObject) {
  return Object.fromEntries(Object.entries(value))
}
</script>

<template>
  <div
    class="nut-dl-grid__card relative min-w-0 h-full"
    :data-selected="selectable ? selected : undefined"
  >
    <TableRowScopeProvider :scope="rowParams">
      <RenderGridCard />
    </TableRowScopeProvider>
    <!--
      Positioned here, not on the control: below `md` the control carries `relative` for its touch
      area, which would beat `absolute` on the same element and put it back in the card's flow.
    -->
    <div
      v-if="showControl"
      class="nut-dl-grid__select absolute top-1 right-1 z-10 flex min-h-11 min-w-11 items-center justify-center"
    >
      <component :is="renderControl({ class: 'size-full justify-center' })" />
    </div>
  </div>
</template>
