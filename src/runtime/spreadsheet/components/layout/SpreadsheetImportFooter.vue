<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

defineProps<{
  hint?: string
  showPrevious?: boolean
  previousLabel?: string
  primaryLabel: string
  primaryDisabled?: boolean
  primaryLoading?: boolean
  showExport?: boolean
  exportLabel?: string
  metaText?: string
  primaryColor?: 'primary' | 'success'
  primaryIcon?: string
}>()

const emit = defineEmits<{
  previous: []
  primary: []
  export: []
}>()

const { t } = useUiToolsLocale()
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-4 border-t border-default/70 bg-default px-6 py-4 lg:px-12">
    <div class="flex flex-wrap items-center gap-4 text-sm text-muted">
      <div v-if="hint" class="flex items-center gap-2">
        <UIcon name="i-lucide-info" class="size-4" />
        <span class="text-xs">{{ hint }}</span>
      </div>

      <template v-if="showExport">
        <UButton color="neutral" variant="ghost" icon="i-lucide-download" :label="exportLabel" @click="emit('export')" />
        <span v-if="metaText" class="font-mono text-[11px]">
          {{ metaText }}
        </span>
      </template>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <UButton
        v-if="showPrevious"
        :label="previousLabel ?? t('spreadsheet.common.previous')"
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-left"
        :disabled="primaryLoading"
        @click="emit('previous')"
      />

      <UButton
        :label="primaryLabel"
        :color="primaryColor ?? 'primary'"
        :icon="primaryIcon"
        loading-icon="i-lucide-loader-circle"
        trailing
        :loading="primaryLoading"
        :disabled="primaryDisabled || primaryLoading"
        @click="emit('primary')"
      />
    </div>
  </div>
</template>
