<script setup lang="ts">
import UIcon from '@nuxt/ui/components/Icon.vue'
import { computed } from 'vue'

import { useUiToolsLocale } from '#ui-tools/i18n'

import type { SpreadsheetRowStatus } from '../../types'

const props = defineProps<{
  status: SpreadsheetRowStatus
  count?: number
  /** Shows the label; the compact form shows an icon and the issue count. */
  full?: boolean
}>()
const { t } = useUiToolsLocale()

const config = computed(
  () =>
    ({
      blocking: { classes: 'bg-error/10 text-error', icon: 'i-lucide-circle-x' },
      discarded: { classes: 'bg-elevated text-muted', icon: 'i-lucide-ban' },
      valid: { classes: 'text-success', icon: 'i-lucide-circle-check' },
      warning: { classes: 'bg-warning/12 text-warning', icon: 'i-lucide-triangle-alert' },
    })[props.status],
)
const label = computed(() => t(`spreadsheet.table.status.${props.status}`))
</script>

<template>
  <span
    class="inline-flex h-5 shrink-0 items-center gap-1 rounded-md px-1.5 text-[11.5px] font-semibold whitespace-nowrap tabular-nums"
    :class="config.classes"
    :title="count ? `${label} · ${count}` : label"
  >
    <UIcon :name="config.icon" class="size-3.5" />
    <template v-if="full"
      >{{ label }}<template v-if="count"> · {{ count }}</template></template
    >
    <template v-else-if="count">{{ count }}</template>
  </span>
</template>
