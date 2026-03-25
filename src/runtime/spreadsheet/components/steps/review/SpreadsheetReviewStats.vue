<script setup lang="ts">
defineProps<{
  items: Array<{
    key: string
    value: number
    label: string
    hint: string
    valueClass: string
    accentClass: string
    cardClass: string
  }>
}>()
</script>

<template>
  <div class="grid gap-3 lg:grid-cols-3">
    <div
      v-for="item in items"
      :key="item.key"
      class="grid gap-3 rounded-[var(--ui-radius)] border bg-default px-5 py-4"
      :class="item.cardClass"
    >
      <div class="flex items-end gap-2">
        <span class="text-[2rem] font-semibold leading-none tracking-[-0.06em]" :class="item.valueClass">
          {{ item.value }}
        </span>
        <span class="pb-1 font-mono text-[11px] text-muted">
          {{ item.label }}
        </span>
      </div>

      <div class="h-1 overflow-hidden rounded-full bg-elevated">
        <div class="h-full w-2/3 rounded-full" :class="item.accentClass" />
      </div>

      <span class="font-mono text-[11px] text-muted">
        {{ item.hint }}
      </span>
    </div>
  </div>
</template>
