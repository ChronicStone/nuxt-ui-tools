<script setup lang="ts">
import UButton from '@nuxt/ui/components/Button.vue'

import type { DataListControlSize } from '#ui-tools/table'

const model = defineModel<DataListControlSize>({ required: true })
const sizes: DataListControlSize[] = ['xs', 'sm', 'md', 'lg', 'xl']
</script>

<template>
  <div class="flex items-center gap-2" data-table-size-selector>
    <span class="text-xs font-medium text-dimmed">Size</span>
    <div class="inline-flex items-center rounded-md border border-default p-0.5">
      <UButton
        v-for="size in sizes"
        :key="size"
        color="neutral"
        :variant="model === size ? 'soft' : 'ghost'"
        :label="size.toUpperCase()"
        size="xs"
        class="min-w-8 justify-center px-2"
        @click="model = size"
      />
    </div>
  </div>
</template>
