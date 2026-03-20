<script setup lang="ts">
import { computed, defineComponent } from 'vue'

import type { TableSchemaView } from '../../types'
import TableRowScopeProvider from '../actions/TableRowScopeProvider.vue'
import { useGridRow, useProvideGridRow } from '../../composables/use-grid-row'
import { useTableInternals } from '../../composables/use-table-internals'

const props = defineProps<{
  rowIndex?: number
}>()

const internals = useTableInternals()
const injectedRowIndex = props.rowIndex === undefined ? useGridRow() : null
const localRowIndex = computed(() => props.rowIndex ?? injectedRowIndex ?? 0)
const rowData = computed(() => internals.grid.rows.value[localRowIndex.value])
type GridRenderItem = NonNullable<NonNullable<TableSchemaView['grid']>['renderItem']>
type GridRenderParams = Parameters<GridRenderItem>[0]

useProvideGridRow(localRowIndex.value)

const rowParams = computed(() =>
  createGridRenderParams({
    row: rowData.value ?? {},
    index: localRowIndex.value,
    context: toPlainRecord(internals.queryContent.contextData.value),
    pageContext: toPlainRecord(internals.queryContent.pageContextData.value),
    tableApi: internals.tableApi,
    layout: 'grid',
  }),
)

const RenderGridCard = defineComponent({
  name: 'RenderGridCard',
  setup() {
    return () => internals.schema.value.grid?.renderItem?.(rowParams.value) ?? null
  },
})

function createGridRenderParams(params: GridRenderParams) {
  return params
}

function toPlainRecord(value: object) {
  return Object.fromEntries(Object.entries(value))
}
</script>

<template>
  <div class="min-w-0 h-full">
    <TableRowScopeProvider :scope="rowParams">
      <RenderGridCard />
    </TableRowScopeProvider>
  </div>
</template>
