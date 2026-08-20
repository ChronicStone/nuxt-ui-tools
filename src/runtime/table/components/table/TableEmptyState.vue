<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import { useDataListUi } from '../../composables/use-data-list-ui'
import type { DataListControlSize } from '../../types'
import { resolveDataListControlGeometry } from '../../utils'

const props = defineProps<{
  minHeight: string
  size?: DataListControlSize
}>()
const { t } = useUiToolsLocale()
const dataListUi = useDataListUi()
const resolvedSize = computed(
  () => props.size ?? dataListUi.ui.value.table?.size ?? dataListUi.controlSize.value,
)
const geometry = computed(() => resolveDataListControlGeometry(resolvedSize.value))
const iconClass = computed(() => {
  if (resolvedSize.value === 'xs') return 'size-5'
  if (resolvedSize.value === 'xl') return 'size-7'
  return 'size-6'
})
</script>

<template>
  <div
    :class="['flex h-full w-full flex-col items-center justify-center py-14', geometry.toolbarGap]"
    :style="{ minHeight }"
  >
    <UIcon name="i-lucide-database-zap" :class="[iconClass, 'text-muted']" />
    <div :class="['grid gap-1 text-center', geometry.text]">
      <div class="font-medium text-highlighted">{{ t('table.states.empty.title') }}</div>
      <div class="text-muted">{{ t('table.states.empty.description') }}</div>
    </div>
  </div>
</template>
