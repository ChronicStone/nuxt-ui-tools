<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

defineProps<{
  reviewRowsLength: number
  maxRecords: number
  overflowCount: number
}>()
const { t } = useUiToolsLocale()

const emit = defineEmits<{
  autoTrim: []
}>()
</script>

<template>
  <div
    class="flex flex-wrap items-start justify-between gap-3 rounded-[var(--ui-radius)] border border-warning/50 bg-warning/8 px-4 py-3"
  >
    <div class="flex min-w-0 items-start gap-2.5">
      <UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-4 shrink-0 text-warning" />
      <div class="grid gap-1">
        <p class="text-[13px] font-semibold text-highlighted">
          {{
            t('spreadsheet.steps.review.overflowTitle', {
              total: reviewRowsLength,
              max: maxRecords,
            })
          }}
        </p>
        <p class="text-xs text-toned">
          {{ t('spreadsheet.steps.review.overflowDescription', { count: overflowCount }) }}
        </p>
      </div>
    </div>

    <UButton
      color="warning"
      variant="outline"
      size="sm"
      :label="t('spreadsheet.steps.review.autoTrim')"
      @click="emit('autoTrim')"
    />
  </div>
</template>
