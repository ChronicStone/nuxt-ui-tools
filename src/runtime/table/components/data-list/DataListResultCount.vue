<script setup lang="ts">
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type { DataListControlSize, DataListResultCountUi } from '../../types'
import { mergeDataListUiClass, resolveDataListControlGeometry } from '../../utils'

const props = defineProps<{ size?: DataListControlSize; ui?: DataListResultCountUi }>()
const internals = useTableInternals()
const dataListUi = useDataListUi()
const { locale, t } = useUiToolsLocale()
const loadedCount = computed(() => internals.queryContent.data.value.rows.length)
const totalCount = computed(() => internals.queryContent.data.value.rowCount)
const formattedCount = computed(() =>
  new Intl.NumberFormat(locale.value.code).format(totalCount.value ?? loadedCount.value),
)
const rootUi = computed(() => dataListUi.ui.value.resultCount?.ui)
const resolvedSize = computed(
  () => props.size ?? dataListUi.ui.value.resultCount?.size ?? dataListUi.controlSize.value,
)
const geometry = computed(() => resolveDataListControlGeometry(resolvedSize.value))
</script>

<template>
  <slot :loaded-count="loadedCount" :total-count="totalCount" :known="totalCount != null">
    <span
      :class="mergeDataListUiClass(`${geometry.text} text-muted`, rootUi?.root, props.ui?.root)"
    >
      {{
        totalCount == null ? t('table.states.loaded', { count: formattedCount }) : formattedCount
      }}
    </span>
  </slot>
</template>
