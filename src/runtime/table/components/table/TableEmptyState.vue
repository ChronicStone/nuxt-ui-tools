<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

defineProps<{
  minHeight: string
}>()
const { t } = useUiToolsLocale()
</script>

<template>
  <div
    class="flex h-full w-full flex-col items-center justify-center gap-3 py-14"
    :style="{ minHeight }"
  >
    <UIcon name="i-lucide-database-zap" class="size-6 text-muted" />
    <div class="grid gap-1 text-center">
      <div class="text-sm font-medium text-highlighted">{{ t('table.states.empty.title') }}</div>
      <div class="text-sm text-muted">{{ t('table.states.empty.description') }}</div>
    </div>
  </div>
</template>
