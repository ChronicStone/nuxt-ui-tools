<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type {
  DataListButtonProps,
  DataListControlSize,
  DataListViewToggleProps,
  DataListViewToggleUi,
} from '../../types'
import { mergeDataListProps, mergeDataListUiClass } from '../../utils'

const props = defineProps<{
  size?: DataListControlSize
  ui?: DataListViewToggleUi
  props?: DataListViewToggleProps
}>()
const internals = useTableInternals()
const dataListUi = useDataListUi()
const { t } = useUiToolsLocale()
const { rowSummary } = internals
const resolvedSize = computed(
  () => props.size ?? dataListUi.ui.value.viewToggle?.size ?? dataListUi.controlSize.value,
)
const resolvedUi = computed<DataListViewToggleUi>(() => ({
  ...dataListUi.ui.value.viewToggle?.ui,
  ...props.ui,
}))
/** Names the view the toggle goes to, not the one the reader is on. */
const label = computed(() =>
  t(rowSummary.active.value ? 'table.header.tableView' : 'table.header.summaryView'),
)
const buttonProps = computed(() =>
  mergeDataListProps<DataListButtonProps>(
    { color: 'primary', size: resolvedSize.value, variant: 'link' },
    dataListUi.ui.value.viewToggle?.props?.button,
    props.props?.button,
  ),
)

function toggle() {
  rowSummary.setActive(!rowSummary.active.value)
}
</script>

<template>
  <slot
    :active="rowSummary.active.value"
    :available="rowSummary.available.value"
    :label="label"
    :toggle="toggle"
  >
    <UButton
      v-if="internals.controls.headerControls.value.summary"
      v-bind="buttonProps"
      :label="label"
      :ui="{
        ...resolvedUi,
        base: mergeDataListUiClass('nut-dl-view-toggle font-semibold', undefined, resolvedUi.base),
      }"
      @click="toggle"
    />
  </slot>
</template>
