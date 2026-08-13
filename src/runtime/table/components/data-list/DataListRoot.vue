<script setup lang="ts">
import { useAppConfig } from 'nuxt/app'
import { computed, onBeforeUnmount, onMounted } from 'vue'
import type { ComputedRef } from 'vue'

import { provideUiToolsLocale, useUiToolsLocaleRef } from '#ui-tools/i18n'
import type { UiToolsLocale, UiToolsMessages } from '#ui-tools/i18n'

import { provideDataListUi } from '../../composables/use-data-list-ui'
import { provideTableInternals, type TableInternals } from '../../composables/use-table-internals'
import type {
  DataListDensity,
  DataListPartConfig,
  DataListSearchConfig,
  DataListUiConfig,
} from '../../types'

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
    mergeDataListUi(resolveAppDataListUi(appConfig), props.ui, props.density),
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

function mergeDataListUi(
  appUi: DataListUiConfig | undefined,
  componentUi: DataListUiConfig | undefined,
  density: DataListDensity | undefined,
): DataListUiConfig {
  return {
    ...appUi,
    ...componentUi,
    density: density ?? componentUi?.density ?? appUi?.density,
    control: { ...appUi?.control, ...componentUi?.control },
    default: mergeUiConfig(appUi?.default, componentUi?.default),
    search: mergeSearchConfig(appUi?.search, componentUi?.search),
    filterTags: mergePartConfig(appUi?.filterTags, componentUi?.filterTags),
    addFilter: mergePartConfig(appUi?.addFilter, componentUi?.addFilter),
    filterPanel: mergePartConfig(appUi?.filterPanel, componentUi?.filterPanel),
    clearFilters: mergePartConfig(appUi?.clearFilters, componentUi?.clearFilters),
    resultCount: mergeUiConfig(appUi?.resultCount, componentUi?.resultCount),
    columnPanel: mergePartConfig(appUi?.columnPanel, componentUi?.columnPanel),
    sortMenu: mergePartConfig(appUi?.sortMenu, componentUi?.sortMenu),
    layoutSwitch: mergePartConfig(appUi?.layoutSwitch, componentUi?.layoutSwitch),
    refresh: mergePartConfig(appUi?.refresh, componentUi?.refresh),
    content: mergeUiConfig(appUi?.content, componentUi?.content),
    table: mergeUiConfig(appUi?.table, componentUi?.table),
    grid: mergeUiConfig(appUi?.grid, componentUi?.grid),
    pagination: mergePartConfig(appUi?.pagination, componentUi?.pagination),
    infiniteLoader: mergePartConfig(appUi?.infiniteLoader, componentUi?.infiniteLoader),
  }
}

function mergeUiConfig<TUi extends object>(
  appDefaults: { ui?: TUi } | undefined,
  componentConfig: { ui?: TUi } | undefined,
) {
  return {
    ...appDefaults,
    ...componentConfig,
    ui: { ...appDefaults?.ui, ...componentConfig?.ui },
  }
}

function mergePartConfig<TUi extends object>(
  appDefaults: DataListPartConfig<TUi> | undefined,
  componentConfig: DataListPartConfig<TUi> | undefined,
) {
  return {
    ...appDefaults,
    ...componentConfig,
    ui: { ...appDefaults?.ui, ...componentConfig?.ui },
  }
}

function mergeSearchConfig(
  appDefaults: DataListSearchConfig | undefined,
  componentConfig: DataListSearchConfig | undefined,
) {
  return {
    ...appDefaults,
    ...componentConfig,
    ui: { ...appDefaults?.ui, ...componentConfig?.ui },
  }
}
</script>

<template>
  <slot :table-api="table.__internals.tableApi" />
</template>
