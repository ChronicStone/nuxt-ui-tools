<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UFieldGroup from '@nuxt/ui/components/FieldGroup.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type { DataListControlSize, DataListLayoutSwitchUi, TableLayout } from '../../types'

const props = withDefaults(
  defineProps<{
    size?: DataListControlSize
    labels?: boolean
    order?: TableLayout[]
    ui?: DataListLayoutSwitchUi
  }>(),
  { order: () => ['table', 'grid'] },
)
const resolvedUi = computed<DataListLayoutSwitchUi>(() => ({
  ...dataListUi.ui.value.layoutSwitch?.ui,
  ...props.ui,
}))
const internals = useTableInternals()
const dataListUi = useDataListUi()
const { t } = useUiToolsLocale()
const resolvedSize = computed(
  () => props.size ?? dataListUi.ui.value.layoutSwitch?.size ?? dataListUi.controlSize.value,
)

function setLayout(layout: TableLayout) {
  internals.controls.setTableLayout(layout)
}
</script>

<template>
  <slot
    :layout="internals.controls.tableLayout.value"
    :set-layout="setLayout"
    :available="internals.controls.layoutState.value.available"
  >
    <UFieldGroup
      v-if="internals.controls.gridEnabled.value"
      :size="resolvedSize"
      :class="resolvedUi.root"
    >
      <UButton
        v-for="layout in order"
        :key="layout"
        color="neutral"
        :variant="internals.controls.tableLayout.value === layout ? 'subtle' : 'outline'"
        :size="resolvedSize"
        :icon="layout === 'table' ? 'i-lucide-table-properties' : 'i-lucide-layout-grid'"
        :label="labels ? (layout === 'table' ? 'Table' : 'Grid') : undefined"
        :aria-label="layout === 'table' ? t('table.header.tableView') : t('table.header.gridView')"
        :title="layout === 'table' ? t('table.header.tableView') : t('table.header.gridView')"
        :ui="{
          base: resolvedUi.trigger,
          label: resolvedUi.triggerLabel,
          leadingIcon: resolvedUi.triggerLeadingIcon,
          trailingIcon: resolvedUi.triggerTrailingIcon,
        }"
        @click="setLayout(layout)"
      />
    </UFieldGroup>
  </slot>
</template>
