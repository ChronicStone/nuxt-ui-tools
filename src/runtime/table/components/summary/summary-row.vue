<script setup lang="ts">
/**
 * One record as a summary row. As a component it is patched by key and re-renders only when its
 * own props change, so rows that stay on screen while the virtual window slides are left alone.
 */
import ULink from '@nuxt/ui/components/Link.vue'
import { computed } from 'vue'

import { isNullish } from '../../../shared/utils/predicate'
import { useTableInternals } from '../../composables/use-table-internals'
import {
  TABLE_SUMMARY_DETAILS_SEPARATOR,
  TABLE_SUMMARY_SLOT_CLASSES,
} from '../../constants/summary'
import type { DataListSummaryUi, GenericObject, TableRowSummaryValue } from '../../types'
import { mergeDataListUiClass } from '../../utils'
import TableRowScopeProvider from '../actions/table-row-scope-provider.vue'
import TableRowActionsControl from '../table/table-row-actions-control.vue'
import TableSelectionControl from '../table/table-selection-control.vue'
import SummaryContent from './summary-content'

const props = defineProps<{
  rowId: string
  original: GenericObject
  index: number
  selected: boolean
  /** The row carries a checkbox. */
  selectable: boolean
  /** The row carries the row-actions button. */
  actions: boolean
  ui?: DataListSummaryUi
}>()
const emit = defineEmits<{ select: [event: MouseEvent] }>()

const internals = useTableInternals()
const summary = computed(() => internals.schema.value.table?.summary)
const params = computed(() => ({
  context: internals.queryContent.contextData.value,
  index: props.index,
  layout: internals.controls.tableLayout.value,
  pageContext: internals.queryContent.pageContextData.value,
  row: props.original,
  tableApi: internals.tableApi,
}))
const title = computed(() => String(summary.value?.title(params.value) ?? ''))
const target = computed(() => summary.value?.to?.(params.value))
const interactive = computed(() => target.value !== undefined || Boolean(summary.value?.onSelect))
const details = computed(() => joinDetails(summary.value?.details?.(params.value) ?? []))

/** Skips what a record has no value for, so a missing city leaves no stray separator. */
function joinDetails(values: TableRowSummaryValue[]) {
  return values
    .filter((value) => value !== false && value !== '' && !isNullish(value))
    .join(TABLE_SUMMARY_DETAILS_SEPARATOR)
}

function css(slot: keyof DataListSummaryUi, extra = '') {
  return mergeDataListUiClass(
    `${TABLE_SUMMARY_SLOT_CLASSES[slot]} ${extra}`,
    undefined,
    props.ui?.[slot],
  )
}
function select() {
  summary.value?.onSelect?.(params.value)
}
</script>

<template>
  <li
    :class="css('row')"
    :data-row-id="rowId"
    :data-index="index"
    :data-selected="selected"
    :data-interactive="interactive"
  >
    <div v-if="selectable" :class="css('select')">
      <TableSelectionControl
        class="min-h-11 min-w-11 justify-center"
        :model-value="selected"
        :row="original"
        :index="index"
        @toggle="emit('select', $event)"
      />
    </div>
    <ULink
      :as="interactive ? 'button' : 'div'"
      :to="target"
      raw
      :class="
        css(
          'main',
          `${selectable ? 'ps-1' : 'ps-[var(--nut-dl-summary-x)]'} ${actions ? 'pe-1' : 'pe-[var(--nut-dl-summary-x)]'}`,
        )
      "
      @click="select"
    >
      <span v-if="summary?.leading" :class="css('leading')">
        <SummaryContent :render="summary.leading" :params="params" />
      </span>
      <span :class="css('body')">
        <span :class="css('title')" :title="title">{{ title }}</span>
        <span v-if="summary?.status || details" :class="css('meta')">
          <span v-if="summary?.status" :class="css('status')">
            <SummaryContent :render="summary.status" :params="params" />
          </span>
          <span v-if="details" :class="css('details')">{{ details }}</span>
        </span>
      </span>
    </ULink>
    <div v-if="actions" :class="css('actions')">
      <TableRowScopeProvider :scope="params">
        <TableRowActionsControl />
      </TableRowScopeProvider>
    </div>
  </li>
</template>
