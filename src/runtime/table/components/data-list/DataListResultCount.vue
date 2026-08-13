<script setup lang="ts">
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDataListUi } from '../../composables/use-data-list-ui'
import { useTableInternals } from '../../composables/use-table-internals'
import type { DataListResultCountUi } from '../../types'
import { mergeDataListUiClass } from '../../utils'

const props = defineProps<{ ui?: DataListResultCountUi }>()
const internals = useTableInternals()
const dataListUi = useDataListUi()
const { locale, t } = useUiToolsLocale()
const loadedCount = computed(() => internals.queryContent.data.value.rows.length)
const totalCount = computed(() => internals.queryContent.data.value.rowCount)
const formattedCount = computed(() =>
  new Intl.NumberFormat(locale.value.code).format(totalCount.value ?? loadedCount.value),
)
const rootUi = computed(() => dataListUi.ui.value.resultCount?.ui)
</script>

<template>
  <slot :loaded-count="loadedCount" :total-count="totalCount" :known="totalCount != null">
    <span :class="mergeDataListUiClass('text-sm text-muted', rootUi?.root, props.ui?.root)">
      {{
        totalCount == null ? t('table.states.loaded', { count: formattedCount }) : formattedCount
      }}
    </span>
  </slot>
</template>
