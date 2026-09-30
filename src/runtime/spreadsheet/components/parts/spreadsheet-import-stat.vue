<script setup lang="ts">
/** One KPI tile, in the style of `SpreadsheetImportStats`. For tiles of your own. */
withDefaults(
  defineProps<{
    value: string | number
    label: string
    hint?: string
    tone?: 'neutral' | 'success' | 'error' | 'warning' | 'info'
  }>(),
  { hint: undefined, tone: 'neutral' },
)
</script>

<template>
  <div
    data-spreadsheet-stat
    class="grid min-w-0 content-start gap-0.5 rounded-lg border border-default bg-elevated/40 px-3.5 py-3"
  >
    <b
      class="text-[22px] leading-7 font-light tracking-[-0.02em] tabular-nums"
      :class="{
        'text-highlighted': tone === 'neutral',
        'text-success': tone === 'success',
        'text-error': tone === 'error',
        'text-warning': tone === 'warning',
        'text-info': tone === 'info',
      }"
    >
      {{ typeof value === 'number' ? value.toLocaleString() : value }}
    </b>
    <span class="truncate text-xs text-muted">{{ label }}</span>
    <span v-if="hint" class="truncate text-[11.5px] text-dimmed">{{ hint }}</span>
  </div>
</template>
