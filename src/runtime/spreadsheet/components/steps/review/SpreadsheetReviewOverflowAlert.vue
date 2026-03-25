<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'
import UIcon from '@nuxt/ui/components/Icon.vue'

defineProps<{
  reviewRowsLength: number
  maxRecords: number
  overflowCount: number
}>()

const emit = defineEmits<{
  autoTrim: []
}>()
</script>

<template>
  <div class="flex flex-wrap items-start justify-between gap-4 rounded-[var(--ui-radius)] border border-warning/50 bg-warning/8 px-5 py-4">
    <div class="flex min-w-0 items-start gap-3">
      <UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-5 shrink-0 text-warning" />
      <div class="grid gap-1">
        <p class="text-sm font-semibold text-highlighted">
          Import limit exceeded — {{ reviewRowsLength }} rows detected, max is {{ maxRecords }}
        </p>
        <p class="text-sm text-toned">
          Select rows to discard below, or auto-trim the last {{ overflowCount }} rows. Discarded rows can be exported.
        </p>
      </div>
    </div>

    <UButton
      color="warning"
      variant="outline"
      size="sm"
      label="Auto-trim"
      @click="emit('autoTrim')"
    />
  </div>
</template>
