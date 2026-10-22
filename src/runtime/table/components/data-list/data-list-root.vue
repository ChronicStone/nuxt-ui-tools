<script setup lang="ts">
import { useAppConfig } from 'nuxt/app'
import { computed, onBeforeUnmount, onMounted } from 'vue'

import { provideUiToolsLocale, useUiToolsLocaleRef } from '#ui-tools/i18n'
import type { UiToolsLocale, UiToolsMessages } from '#ui-tools/i18n'

import { isObject } from '../../../shared/utils/predicate'
import { useDataListBreakpoint } from '../../composables/use-data-list-breakpoint'
import { provideDataListOverlayInset } from '../../composables/use-data-list-overlay-inset'
import { provideDataListUi } from '../../composables/use-data-list-ui'
import { provideTableInternals } from '../../composables/use-table-internals'
import type {
  DataListControlSize,
  DataListDensity,
  DataListTable,
  DataListUiConfig,
} from '../../types'
import { mergeDataListUiConfig } from '../../utils'
import { layerDataListMobileDefaults } from '../../utils/mobile-defaults'

interface AppConfigRoot {
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
provideDataListOverlayInset()
const { isMobile } = useDataListBreakpoint()
provideDataListUi(
  computed<DataListUiConfig>(() => {
    const merged = mergeDataListUiConfig(
      resolveAppDataListUi(appConfig),
      props.ui,
      props.density,
      props.size,
    )
    if (!isMobile.value) {
      return merged
    }
    const { mobile } = merged
    return layerDataListMobileDefaults(
      mobile ? mergeDataListUiConfig(merged, mobile, mobile.density, mobile.control?.size) : merged,
    )
  }),
)

onMounted(() => props.table['__internals'].startup.scheduleStart())
onBeforeUnmount(() => props.table['__internals'].startup.dispose())

function resolveAppDataListUi(config: AppConfigRoot): DataListUiConfig | undefined {
  if (!config.nuxtUiTools || !isObject(config.nuxtUiTools)) {
    return undefined
  }
  if (!('dataList' in config.nuxtUiTools)) {
    return undefined
  }
  return isDataListUiConfig(config.nuxtUiTools.dataList) ? config.nuxtUiTools.dataList : undefined
}

function isDataListUiConfig<TValue>(value: TValue): value is TValue & DataListUiConfig {
  return isObject(value)
}
</script>

<template>
  <slot :table-api="table.__internals.tableApi" />
</template>
