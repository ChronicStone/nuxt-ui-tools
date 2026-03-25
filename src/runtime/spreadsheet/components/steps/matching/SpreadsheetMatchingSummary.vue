<script setup lang="ts">
const props = defineProps<{
  items: Array<{
    key: string
    label: string
    value: number
    tone: 'success' | 'warning' | 'error' | 'neutral'
  }>
}>()

function getSummaryBarClass(tone: 'success' | 'warning' | 'error' | 'neutral') {
  if (tone === 'success') return 'bg-success'
  if (tone === 'warning') return 'bg-warning'
  if (tone === 'error') return 'bg-error'
  return 'bg-muted'
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-6 border-b border-default/70 pb-1">
    <div
      v-for="item in props.items"
      :key="item.key"
      class="flex min-w-36 flex-1 items-center gap-4 py-2"
    >
      <div class="h-8 w-[3px]" :class="getSummaryBarClass(item.tone)" />

      <div class="grid gap-0.5">
        <span class="text-3xl font-semibold leading-none tracking-[-0.05em] text-highlighted">
          {{ item.value }}
        </span>
        <span class="font-mono text-[11px] font-medium text-muted">
          {{ item.label }}
        </span>
      </div>
    </div>
  </div>
</template>
