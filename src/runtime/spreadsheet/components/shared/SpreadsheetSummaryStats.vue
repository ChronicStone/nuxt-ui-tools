<script setup lang="ts">
const props = defineProps<{
  items: Array<{
    label: string
    value: string | number
    color?: 'primary' | 'neutral' | 'success' | 'warning' | 'error' | 'secondary' | 'info'
  }>
}>()
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <div
      v-for="item in props.items"
      :key="item.label"
      class="grid gap-1 border-l-2 pl-3"
      :class="
        item.color === 'success'
          ? 'border-success'
          : item.color === 'warning'
            ? 'border-warning'
            : item.color === 'error'
              ? 'border-error'
              : item.color === 'primary'
                ? 'border-primary'
                : 'border-default/70'
      "
    >
      <span class="text-xl font-semibold text-highlighted">
        {{ item.value }}
      </span>
      <span class="text-xs text-muted">
        {{ item.label }}
      </span>
    </div>
  </div>
</template>
