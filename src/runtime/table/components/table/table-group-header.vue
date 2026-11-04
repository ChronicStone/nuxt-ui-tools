<script setup lang="ts">
/**
 * What a group's header row shows, in the table and between the cards of the grid alike: the
 * group's checkbox where its rows have one, the chevron, the label and the summary.
 */
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useTableInternals } from '../../composables/use-table-internals'
import type { TableGroup } from '../../types'
import GroupHeader from '../group-header.vue'
import TableCell from './table-cell'
import TableSelectionControl from './table-selection-control.vue'

const props = defineProps<{
  group: TableGroup
  /** Whether the rows beneath it carry checkboxes. */
  selectable?: boolean
}>()

const { groups, selection } = useTableInternals()
const { t } = useUiToolsLocale()

const collapsed = computed(() => groups.isCollapsed(props.group))
const params = computed(() => ({ rows: props.group.rows, value: props.group.value }))
const checked = computed(() => selection.getRowsSelectionState({ rowIds: props.group.rowIds }))
const showCheckbox = computed(() => props.selectable && selection.selectionEnabled.value)

function renderLabel() {
  const label = groups.config.value?.label
  if (label) return label(params.value)
  return props.group.value === undefined ? t('table.groups.empty') : String(props.group.value)
}

function renderSummary() {
  const summary = groups.config.value?.summary
  return summary ? summary(params.value) : props.group.rows.length
}

function toggleSelection() {
  const { rowIds } = props.group
  if (checked.value === true) selection.unselectRows({ rowIds })
  else selection.selectRows({ rowIds })
}
</script>

<template>
  <GroupHeader
    :collapsed="collapsed"
    :toggle-label="t('table.groups.toggle')"
    @toggle="groups.toggle(group)"
  >
    <template v-if="showCheckbox" #leading>
      <TableSelectionControl
        :model-value="checked"
        :label="t('table.groups.select')"
        @toggle="toggleSelection"
      />
    </template>
    <TableCell :index="0" :render="renderLabel" :row="group" />
    <template #summary>
      <TableCell :index="0" :render="renderSummary" :row="group" />
    </template>
  </GroupHeader>
</template>

<style>
.nut-dl-row.nut-dl-row--group {
  background: var(--nut-dl-head-bg);
}
.nut-dl-row.nut-dl-row--group:hover {
  background: color-mix(in srgb, var(--nut-dl-head-fg) 7%, var(--nut-dl-head-bg));
}
/* Not a `.nut-dl-td`: that clips its content, and the header must stay in view while columns scroll. */
.nut-dl-group-cell {
  background: inherit;
  border-bottom: 1px solid var(--nut-dl-line);
  height: var(--nut-dl-head-h);
  padding: 0;
}
.nut-dl-grid__group {
  border-bottom: 1px solid var(--ui-border);
}
</style>
