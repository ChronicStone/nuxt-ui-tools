<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type {
  DataListButtonProps,
  DataListControlSize,
  DataListRefreshProps,
  DataListRefreshUi,
} from '../../types'
import { mergeDataListProps, mergeDataListUiClass } from '../../utils'

const props = defineProps<{
  label?: string
  size?: DataListControlSize
  ui?: DataListRefreshUi
  props?: DataListRefreshProps
}>()
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
const buttonProps = computed(() =>
  mergeDataListProps<DataListButtonProps>(
    { color: 'neutral', icon: 'i-lucide-refresh-cw', size: resolvedSize.value, variant: 'outline' },
    dataListUi.ui.value.refresh?.props?.button,
    props.props?.button,
  ),
)

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
      v-bind="buttonProps"
      :label="label"
      :square="!label"
      :aria-label="t('table.header.refreshData')"
      :title="t('table.header.refreshData')"
      :data-refreshing="loading"
      :ui="{
        ...resolvedUi,
        base: mergeDataListUiClass('nut-dl-refresh', undefined, resolvedUi.base),
        leadingIcon: mergeDataListUiClass(
          loading ? 'nut-dl-refresh__icon--spinning' : 'nut-dl-refresh__icon',
          undefined,
          resolvedUi.leadingIcon,
        ),
      }"
      @click="refresh"
    />
  </slot>
</template>

<style>
.nut-dl-refresh__icon--spinning {
  animation: nut-dl-refresh-spin 0.7s linear infinite;
}
@keyframes nut-dl-refresh-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
