<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

defineProps<{
  title: string
  description?: string
  closable?: boolean
}>()

const { t } = useUiToolsLocale()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="flex items-start justify-between gap-3">
    <div class="grid gap-1">
      <h1 class="text-[1.75rem] font-semibold leading-none tracking-[-0.06em] text-highlighted">
        {{ title }}
      </h1>
      <p v-if="description" class="text-[13px] text-toned">
        {{ description }}
      </p>
    </div>

    <UButton
      v-if="closable"
      color="neutral"
      variant="ghost"
      size="sm"
      square
      icon="i-lucide-x"
      :aria-label="t('spreadsheet.common.closeImport')"
      :title="t('spreadsheet.common.closeImport')"
      @click="emit('close')"
    />
  </div>
</template>
