<script setup lang="ts">
import { useAppConfig } from 'nuxt/app'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import type { ComputedRef } from 'vue'

import { provideUiToolsLocale, useUiToolsLocaleRef } from '#ui-tools/i18n'
import type { UiToolsLocale, UiToolsMessages } from '#ui-tools/i18n'

import { isObject } from '../../../shared/utils/predicate'
import { provideDataListUi } from '../../composables/use-data-list-ui'
import { provideTableInternals, type TableInternals } from '../../composables/use-table-internals'
import type { DataListControlSize, DataListDensity, DataListUiConfig } from '../../types'
import { mergeDataListUiConfig } from '../../utils'

type DataListTable = {
  schema: ComputedRef<{ tableKey: string }>
  __internals: TableInternals
}
type AppConfigRoot = {
  nuxtUiTools?: {
    dataList?: unknown
  }
}

const props = defineProps<{
  table: DataListTable
  locale?: UiToolsLocale<UiToolsMessages>
  density?: DataListDensity
  size?: DataListControlSize
  ui?: DataListUiConfig
}>()
const appConfig = useAppConfig()

provideTableInternals(props.table['__internals'])
provideUiToolsLocale(useUiToolsLocaleRef(computed(() => props.locale)))
provideDataListUi(
  computed<DataListUiConfig>(() =>
    mergeDataListUiConfig(resolveAppDataListUi(appConfig), props.ui, props.density, props.size),
  ),
)

onMounted(() => props.table['__internals'].startup.scheduleStart())
onBeforeUnmount(() => props.table['__internals'].startup.dispose())

function resolveAppDataListUi(config: AppConfigRoot): DataListUiConfig | undefined {
  if (!config.nuxtUiTools || !isObject(config.nuxtUiTools)) return undefined
  if (!('dataList' in config.nuxtUiTools)) return undefined
  return isDataListUiConfig(config.nuxtUiTools.dataList) ? config.nuxtUiTools.dataList : undefined
}

function isDataListUiConfig<TValue>(value: TValue): value is TValue & DataListUiConfig {
  return isObject(value)
}
</script>

<template>
  <slot :table-api="table.__internals.tableApi" />
</template>
