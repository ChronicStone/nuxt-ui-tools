<script setup lang="ts">
defineProps<{
  label: string
  active?: boolean
}>()

defineSlots<{
  actions?: () => any
  default?: () => any
}>()
</script>

<template>
  <section class="relative grid gap-1.5">
    <div class="min-w-0 pr-24">
      <div class="min-w-0">
        <h3 class="truncate text-sm font-medium text-highlighted">
          {{ label }}
        </h3>
      </div>
    </div>

    <div class="absolute right-0 top-0 flex shrink-0 items-center gap-2">
      <slot name="actions" />
    </div>

    <slot />
  </section>
</template>
