<script setup lang="ts">
import { useAppConfig } from 'nuxt/app'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import type { ComputedRef } from 'vue'

import { provideUiToolsLocale, useUiToolsLocaleRef } from '#ui-tools/i18n'
import type { UiToolsLocale, UiToolsMessages } from '#ui-tools/i18n'

import { provideDataListUi } from '../../composables/use-data-list-ui'
import { provideTableInternals, type TableInternals } from '../../composables/use-table-internals'
import type { DataListDensity, DataListUiConfig } from '../../types'
import { mergeDataListUiConfig } from '../../utils'

type DataListTable = {
  schema: ComputedRef<{ tableKey: string }>
  __internals: TableInternals
}

const props = defineProps<{
  table: DataListTable
  locale?: UiToolsLocale<UiToolsMessages>
  density?: DataListDensity
  ui?: DataListUiConfig
}>()
const appConfig = useAppConfig()

provideTableInternals(props.table.__internals)
provideUiToolsLocale(useUiToolsLocaleRef(computed(() => props.locale)))
provideDataListUi(
  computed<DataListUiConfig>(() =>
    mergeDataListUiConfig(resolveAppDataListUi(appConfig), props.ui, props.density),
  ),
)

onMounted(() => props.table.__internals.startup.scheduleStart())
onBeforeUnmount(() => props.table.__internals.startup.dispose())

function resolveAppDataListUi(config: object): DataListUiConfig | undefined {
  if (!('nuxtUiTools' in config) || !config.nuxtUiTools || typeof config.nuxtUiTools !== 'object')
    return undefined
  if (!('dataList' in config.nuxtUiTools)) return undefined
  return isDataListUiConfig(config.nuxtUiTools.dataList) ? config.nuxtUiTools.dataList : undefined
}

function isDataListUiConfig(value: unknown): value is DataListUiConfig {
  return Boolean(value) && typeof value === 'object'
}
</script>

<template>
  <slot :table-api="table.__internals.tableApi" />
</template>
