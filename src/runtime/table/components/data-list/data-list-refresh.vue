<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type { DataListControlSize, DataListRefreshUi } from '../../types'

const props = defineProps<{ label?: string; size?: DataListControlSize; ui?: DataListRefreshUi }>()
const internals = useTableInternals()
const dataListUi = useDataListUi()
const { t } = useUiToolsLocale()
const loading = computed(
  () =>
    internals.queryContent.status.value.isFetching ||
    internals.queryContent.status.value.isRefreshing ||
    internals.queryContent.status.value.isRevalidating,
)
const resolvedSize = computed(
  () => props.size ?? dataListUi.ui.value.refresh?.size ?? dataListUi.controlSize.value,
)
const resolvedUi = computed<DataListRefreshUi>(() => ({
  ...dataListUi.ui.value.refresh?.ui,
  ...props.ui,
}))

function refresh() {
  void internals.queryContent.refreshData()()
}
</script>

<template>
  <slot
    :refresh="refresh"
    :loading="loading"
    :trigger-props="{ type: 'button', disabled: loading, onClick: refresh }"
  >
    <UButton
      color="neutral"
      variant="outline"
      :size="resolvedSize"
      icon="i-lucide-refresh-cw"
      :label="label"
      :loading="loading"
      :aria-label="t('table.header.refreshData')"
      :title="t('table.header.refreshData')"
      :ui="resolvedUi"
      @click="refresh"
    />
  </slot>
</template>
