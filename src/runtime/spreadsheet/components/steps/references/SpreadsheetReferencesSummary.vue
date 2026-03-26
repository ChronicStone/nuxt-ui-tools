<script setup lang="ts">
const props = defineProps<{
  items: Array<{
    key: string
    label: string
    value: number
    barClass: string
  }>
}>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-6">
    <div
      v-for="item in props.items"
      :key="item.key"
      class="flex min-w-36 flex-1 items-center gap-3"
    >
      <div class="h-11 w-[3px]" :class="item.barClass" />

      <div class="grid gap-1">
        <span class="text-2xl font-semibold leading-none tracking-[-0.05em] text-highlighted">
          {{ item.value }}
        </span>
        <span class="text-xs text-muted">
          {{ item.label }}
        </span>
      </div>
    </div>
  </div>
</template>
